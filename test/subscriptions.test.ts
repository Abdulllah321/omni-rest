import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SubscriptionBus, formatSseEvent, formatSseHeartbeat } from "../src/subscriptions";
import type { ModelMeta, SseEvent } from "../src/types";

// ─── Minimal ModelMeta fixtures ───────────────────────────────────────────────

/** Model with both createdAt and updatedAt — full watermark detection. */
const timestampedMeta: ModelMeta = {
  name: "Department",
  routeName: "department",
  idField: "id",
  fields: [
    { name: "id",        type: "Int",      isId: true,  isRequired: true,  isList: false, isRelation: false, hasDefaultValue: true,  isUpdatedAt: false },
    { name: "name",      type: "String",   isId: false, isRequired: true,  isList: false, isRelation: false, hasDefaultValue: false, isUpdatedAt: false },
    { name: "createdAt", type: "DateTime", isId: false, isRequired: true,  isList: false, isRelation: false, hasDefaultValue: true,  isUpdatedAt: false },
    { name: "updatedAt", type: "DateTime", isId: false, isRequired: true,  isList: false, isRelation: false, hasDefaultValue: false, isUpdatedAt: true  },
  ],
};

/** Model with no timestamp fields — ID-set diff only. */
const noTimestampMeta: ModelMeta = {
  name: "Category",
  routeName: "category",
  idField: "id",
  fields: [
    { name: "id",    type: "Int",    isId: true,  isRequired: true, isList: false, isRelation: false, hasDefaultValue: true,  isUpdatedAt: false },
    { name: "label", type: "String", isId: false, isRequired: true, isList: false, isRelation: false, hasDefaultValue: false, isUpdatedAt: false },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal Prisma-like delegate mock.
 * `findManySequence` is a list of return values to hand out one by one.
 */
function makeMockDelegate(opts: {
  initialIds?: number[];
  findManySequence?: any[][];
  findUnique?: any;
} = {}) {
  const sequence = [...(opts.findManySequence ?? [])];
  let call = 0;

  return {
    findMany: vi.fn(async () => {
      const result = sequence[call] ?? [];
      call++;
      return result;
    }),
    findUnique: vi.fn(async () => opts.findUnique ?? null),
  };
}

/** Builds a fake PrismaClient from a delegate map. */
function makePrisma(delegates: Record<string, ReturnType<typeof makeMockDelegate>>) {
  return {
    _runtimeDataModel: { models: {} }, // not used by SubscriptionBus directly
    ...delegates,
  } as any;
}

// ─── SSE format helpers ───────────────────────────────────────────────────────

describe("formatSseEvent", () => {
  it("serialises a create event correctly", () => {
    const event: SseEvent = { event: "create", model: "Department", record: { id: 1, name: "Eng" } };
    const line = formatSseEvent(event);
    expect(line).toBe(`data: ${JSON.stringify(event)}\n\n`);
  });

  it("serialises a delete event correctly", () => {
    const event: SseEvent = { event: "delete", model: "Department", id: 5 };
    const line = formatSseEvent(event);
    expect(line).toContain("\"event\":\"delete\"");
    expect(line.endsWith("\n\n")).toBe(true);
  });
});

describe("formatSseHeartbeat", () => {
  it("returns a valid SSE comment line", () => {
    expect(formatSseHeartbeat()).toBe(": heartbeat\n\n");
  });
});

// ─── SubscriptionBus ──────────────────────────────────────────────────────────

describe("SubscriptionBus", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // ── Zero-overhead guarantee ─────────────────────────────────────────────────

  it("does not start any DB polling before subscribe() is called", () => {
    const delegate = makeMockDelegate();
    const prisma = makePrisma({ department: delegate });
    new SubscriptionBus(prisma, { pollInterval: 100 });

    // No calls yet — not even the initial snapshot
    expect(delegate.findMany).not.toHaveBeenCalled();
  });

  it("reports zero active subscribers before any subscription", () => {
    const prisma = makePrisma({ department: makeMockDelegate() });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });
    expect(bus.activeSubscriberCount).toBe(0);
    expect(bus.activeModels).toEqual([]);
  });

  // ── Guard check ────────────────────────────────────────────────────────────

  it("checkGuard returns null when no guard is configured", async () => {
    const prisma = makePrisma({ department: makeMockDelegate() });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });
    const result = await bus.checkGuard({}, "department", { body: {} });
    expect(result).toBeNull();
  });

  it("checkGuard returns error string when GET guard blocks", async () => {
    const prisma = makePrisma({ department: makeMockDelegate() });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });
    const result = await bus.checkGuard(
      { department: { GET: () => "Forbidden" } },
      "department",
      { body: {} }
    );
    expect(result).toBe("Forbidden");
  });

  // ── Subscribe lifecycle ────────────────────────────────────────────────────

  it("starts polling after first subscribe()", async () => {
    const delegate = makeMockDelegate({
      // initial snapshot + first tick queries
      findManySequence: [
        [{ id: 1 }],          // initial ID snapshot
        [],                   // tick: createdAt > watermark
        [],                   // tick: updatedAt > watermark
        [{ id: 1 }],          // tick: current IDs
      ],
    });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const listener = vi.fn();
    await bus.subscribe(timestampedMeta, listener);

    expect(bus.activeSubscriberCount).toBe(1);
    expect(bus.activeModels).toContain("department");

    // Advance one poll tick
    await vi.advanceTimersByTimeAsync(100);
  });

  it("increments subscriber count when multiple clients subscribe to the same model", async () => {
    const delegate = makeMockDelegate({ findManySequence: [[{ id: 1 }]] });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 500 });

    const l1 = vi.fn();
    const l2 = vi.fn();

    await bus.subscribe(timestampedMeta, l1);
    await bus.subscribe(timestampedMeta, l2);

    expect(bus.activeSubscriberCount).toBe(2);
    // Still only one bus for department
    expect(bus.activeModels).toEqual(["department"]);
  });

  // ── Disconnect / cleanup ───────────────────────────────────────────────────

  it("removes subscriber and clears interval when last client unsubscribes", async () => {
    const delegate = makeMockDelegate({ findManySequence: [[{ id: 1 }]] });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const listener = vi.fn();
    const unsubscribe = await bus.subscribe(timestampedMeta, listener);

    expect(bus.activeSubscriberCount).toBe(1);

    unsubscribe();

    expect(bus.activeSubscriberCount).toBe(0);
    expect(bus.activeModels).toEqual([]);
  });

  it("keeps the bus alive when one of two subscribers disconnects", async () => {
    const delegate = makeMockDelegate({ findManySequence: [[{ id: 1 }]] });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const l1 = vi.fn();
    const l2 = vi.fn();

    const unsub1 = await bus.subscribe(timestampedMeta, l1);
    await bus.subscribe(timestampedMeta, l2);

    unsub1();

    expect(bus.activeSubscriberCount).toBe(1);
    expect(bus.activeModels).toContain("department");
  });

  // ── Event emission ────────────────────────────────────────────────────────

  it("emits 'create' event when a new record appears in createdAt diff", async () => {
    const newRecord = { id: 2, name: "Finance", createdAt: new Date(), updatedAt: new Date() };

    const delegate = makeMockDelegate({
      findManySequence: [
        [{ id: 1 }],                 // initial snapshot
        [newRecord],                 // tick: createdAt > watermark  → create
        [],                          // tick: updatedAt > watermark  → update (none)
        [{ id: 1 }, { id: 2 }],      // tick: current IDs
      ],
    });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const received: SseEvent[] = [];
    await bus.subscribe(timestampedMeta, (e) => received.push(e));

    await vi.advanceTimersByTimeAsync(100);

    const creates = received.filter((e) => e.event === "create");
    expect(creates.length).toBeGreaterThanOrEqual(1);
    expect(creates[0].model).toBe("Department");
    expect(creates[0].record?.id).toBe(2);
  });

  it("emits 'update' event when an existing record's updatedAt changes", async () => {
    const updatedRecord = { id: 1, name: "Engineering Updated", createdAt: new Date(0), updatedAt: new Date() };

    const delegate = makeMockDelegate({
      findManySequence: [
        [{ id: 1 }],          // initial snapshot
        [],                   // tick: createdAt > watermark (nothing new)
        [updatedRecord],      // tick: updatedAt > watermark → update
        [{ id: 1 }],          // tick: current IDs
      ],
    });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const received: SseEvent[] = [];
    await bus.subscribe(timestampedMeta, (e) => received.push(e));

    await vi.advanceTimersByTimeAsync(100);

    const updates = received.filter((e) => e.event === "update");
    expect(updates.length).toBeGreaterThanOrEqual(1);
    expect(updates[0].record?.id).toBe(1);
  });

  it("emits 'delete' event when an ID disappears from the ID set", async () => {
    const delegate = makeMockDelegate({
      findManySequence: [
        [{ id: 1 }, { id: 2 }],  // initial snapshot
        [],                       // tick: create diff
        [],                       // tick: update diff
        [{ id: 1 }],              // tick: current IDs — id 2 is gone
      ],
    });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const received: SseEvent[] = [];
    await bus.subscribe(timestampedMeta, (e) => received.push(e));

    await vi.advanceTimersByTimeAsync(100);

    const deletes = received.filter((e) => e.event === "delete");
    expect(deletes.length).toBe(1);
    expect(deletes[0].id).toBe(2);
  });

  it("emits 'create' via ID diff when model has no createdAt field", async () => {
    const newRow = { id: 3, label: "NewCat" };
    const delegate = makeMockDelegate({
      findManySequence: [
        [{ id: 1 }],           // initial snapshot
        [{ id: 1 }, { id: 3 }], // tick: current IDs — id 3 is new
      ],
      findUnique: newRow,
    });
    const prisma = makePrisma({ category: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const received: SseEvent[] = [];
    await bus.subscribe(noTimestampMeta, (e) => received.push(e));

    await vi.advanceTimersByTimeAsync(100);

    const creates = received.filter((e) => e.event === "create");
    expect(creates.length).toBeGreaterThanOrEqual(1);
    expect(creates[0].record?.id).toBe(3);
  });

  // ── Field guard stripping ────────────────────────────────────────────────

  it("strips hidden fields from SSE event records", async () => {
    const record = { id: 2, name: "Finance", secret: "s3cr3t", createdAt: new Date(), updatedAt: new Date() };

    const delegate = makeMockDelegate({
      findManySequence: [
        [{ id: 1 }],            // initial snapshot
        [record],               // tick: create diff
        [],                     // tick: update diff
        [{ id: 1 }, { id: 2 }], // tick: current IDs
      ],
    });
    const prisma = makePrisma({ department: delegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    const received: SseEvent[] = [];
    await bus.subscribe(
      timestampedMeta,
      (e) => received.push(e),
      { hidden: ["secret"] }
    );

    await vi.advanceTimersByTimeAsync(100);

    const creates = received.filter((e) => e.event === "create");
    expect(creates.length).toBeGreaterThanOrEqual(1);
    expect(creates[0].record).not.toHaveProperty("secret");
    expect(creates[0].record).toHaveProperty("name");
  });

  // ── Multi-model isolation ─────────────────────────────────────────────────

  it("does NOT poll Category when only Department has a subscriber", async () => {
    const deptDelegate = makeMockDelegate({ findManySequence: [[{ id: 1 }]] });
    const catDelegate = makeMockDelegate();
    const prisma = makePrisma({ department: deptDelegate, category: catDelegate });
    const bus = new SubscriptionBus(prisma, { pollInterval: 100 });

    await bus.subscribe(timestampedMeta, vi.fn());

    await vi.advanceTimersByTimeAsync(300);

    // Category delegate should have had zero calls — no subscriber, no poll
    expect(catDelegate.findMany).not.toHaveBeenCalled();
  });

  // ── PrismaRestOptions.subscription wiring ────────────────────────────────

  it("createRouter returns a subscriptionBus", async () => {
    const { createRouter } = await import("../src/router");
    const { createMockPrisma } = await import("./fixtures/mockPrisma");
    const prisma = createMockPrisma();
    const { subscriptionBus } = createRouter(prisma as any, { subscription: { pollInterval: 500 } });
    expect(subscriptionBus).toBeDefined();
    expect(typeof subscriptionBus.subscribe).toBe("function");
  });
});
