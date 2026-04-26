import type { PrismaClient } from "@prisma/client";
import type { ModelMeta, SseEvent, SubscriptionOptions, FieldGuardConfig, GuardMap } from "./types";
import { getDelegate } from "./introspect";
import { runGuard } from "./middleware-helpers";

// ─── Public helpers (adapters write these bytes to the response) ──────────────

/** Formats a single SSE event line. */
export function formatSseEvent(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Formats a heartbeat comment that keeps the TCP connection alive through proxies. */
export function formatSseHeartbeat(): string {
  return ": heartbeat\n\n";
}

// ─── Subscription Bus ─────────────────────────────────────────────────────────

type Listener = (event: SseEvent) => void;

interface ModelBus {
  interval: ReturnType<typeof setInterval>;
  listeners: Set<Listener>;
  /** Timestamp of the last poll tick — used for watermark-based create/update detection. */
  watermark: Date;
  /** ID snapshot — used to detect hard-deletes by diffing current IDs against known ones. */
  knownIds: Set<unknown>;
  /** Whether the model has createdAt / updatedAt fields (determined once at bus init). */
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
}

/**
 * SubscriptionBus manages one shared Prisma poll interval per model.
 *
 * Key performance properties:
 *  - Zero DB activity for any model that has no active subscribers.
 *  - When the first client subscribes to model X, one interval is started.
 *  - Additional clients for the same model share that single interval (fan-out).
 *  - When the last client disconnects, the interval is immediately cleared.
 *
 * This ensures CRUD routes for un-subscribed tables incur no extra overhead.
 */
export class SubscriptionBus {
  private buses = new Map<string, ModelBus>();

  constructor(
    private prisma: PrismaClient,
    private options: SubscriptionOptions = {}
  ) {}

  // ── Per-connection guard check ──────────────────────────────────────────────

  /**
   * Applies the GET guard for the model.
   * Returns an error string if the subscriber should be rejected, null if allowed.
   */
  async checkGuard(
    guards: GuardMap,
    modelRouteName: string,
    ctx: { id?: string | null; body?: any }
  ): Promise<string | null> {
    return runGuard(guards, modelRouteName, "GET", ctx);
  }

  // ── Bus lifecycle ───────────────────────────────────────────────────────────

  private async initBus(meta: ModelMeta, fg?: FieldGuardConfig): Promise<ModelBus> {
    const delegate = getDelegate(this.prisma, meta);
    const pollMs = this.options.pollInterval ?? 1_000;

    const hasCreatedAt = meta.fields.some((f) => f.name === "createdAt");
    const hasUpdatedAt = meta.fields.some((f) => f.name === "updatedAt");

    // Snapshot initial IDs so we can detect deletes on the first tick
    let initialIds: unknown[] = [];
    try {
      const rows = await (delegate as any).findMany({
        select: { [meta.idField]: true },
      });
      initialIds = rows.map((r: any) => r[meta.idField]);
    } catch {
      // Empty table or transient error — start with an empty set
    }

    const bus: ModelBus = {
      interval: null as any, // assigned below
      listeners: new Set(),
      watermark: new Date(),
      knownIds: new Set(initialIds),
      hasCreatedAt,
      hasUpdatedAt,
    };

    bus.interval = setInterval(async () => {
      // Skip work entirely when no clients are listening
      if (bus.listeners.size === 0) return;

      const tick = new Date();

      try {
        // ── 1. Watermark-based create / update detection ──────────────────────
        if (bus.hasCreatedAt && bus.hasUpdatedAt) {
          const [created, updated] = await Promise.all([
            // New records: createdAt after the last watermark
            (delegate as any).findMany({
              where: { createdAt: { gt: bus.watermark } },
            }),
            // Changed records: updatedAt after watermark but created before it
            (delegate as any).findMany({
              where: {
                updatedAt: { gt: bus.watermark },
                createdAt: { lte: bus.watermark },
              },
            }),
          ]);

          for (const record of created) {
            bus.knownIds.add(record[meta.idField]);
            const event: SseEvent = {
              event: "create",
              model: meta.name,
              record: stripFieldGuard(record, fg),
            };
            bus.listeners.forEach((l) => l(event));
          }

          for (const record of updated) {
            const event: SseEvent = {
              event: "update",
              model: meta.name,
              record: stripFieldGuard(record, fg),
            };
            bus.listeners.forEach((l) => l(event));
          }
        } else if (bus.hasUpdatedAt) {
          // No createdAt — only detect updates
          const updated = await (delegate as any).findMany({
            where: { updatedAt: { gt: bus.watermark } },
          });
          for (const record of updated) {
            const event: SseEvent = {
              event: "update",
              model: meta.name,
              record: stripFieldGuard(record, fg),
            };
            bus.listeners.forEach((l) => l(event));
          }
        }

        // ── 2. ID-set diff for delete detection ───────────────────────────────
        // This works regardless of whether the model has timestamp fields.
        // One extra SELECT(id) per tick — much cheaper than a full row fetch.
        const currentRows = await (delegate as any).findMany({
          select: { [meta.idField]: true },
        });
        const currentIds = new Set<unknown>(currentRows.map((r: any) => r[meta.idField]));

        // IDs we knew about but are gone → deleted
        for (const id of bus.knownIds) {
          if (!currentIds.has(id)) {
            bus.knownIds.delete(id);
            const event: SseEvent = { event: "delete", model: meta.name, id };
            bus.listeners.forEach((l) => l(event));
          }
        }

        // Absorb newly created IDs into the known set
        // (if timestamp-based path above already fired "create", this is a no-op for those IDs)
        for (const id of currentIds) {
          if (!bus.knownIds.has(id)) {
            bus.knownIds.add(id);
            // If we have no createdAt field we wouldn't have caught this above — emit now
            if (!bus.hasCreatedAt) {
              const row = await (delegate as any).findUnique({
                where: { [meta.idField]: id },
              }).catch(() => null);
              if (row) {
                const event: SseEvent = {
                  event: "create",
                  model: meta.name,
                  record: stripFieldGuard(row, fg),
                };
                bus.listeners.forEach((l) => l(event));
              }
            }
          }
        }

        bus.watermark = tick;
      } catch {
        // Swallow individual poll errors — don't crash the bus
      }
    }, pollMs);

    return bus;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Subscribes a listener to events for the given model.
   *
   * If no bus exists for this model yet, one is created (starting the DB poll).
   * If a bus already exists, the listener is simply added to its fan-out set.
   *
   * Returns an unsubscribe function. Call it when the client disconnects — if
   * this was the last listener the poll interval is immediately cleared.
   */
  async subscribe(
    meta: ModelMeta,
    listener: Listener,
    fg?: FieldGuardConfig
  ): Promise<() => void> {
    let bus = this.buses.get(meta.routeName);

    if (!bus) {
      bus = await this.initBus(meta, fg);
      this.buses.set(meta.routeName, bus);
    }

    bus.listeners.add(listener);

    return () => {
      if (!bus) return;
      bus.listeners.delete(listener);

      // Tear down the poll when nobody is watching this model
      if (bus.listeners.size === 0) {
        clearInterval(bus.interval);
        this.buses.delete(meta.routeName);
      }
    };
  }

  /**
   * Returns the number of active listeners across all model buses.
   * Useful for diagnostics / metrics.
   */
  get activeSubscriberCount(): number {
    let total = 0;
    for (const bus of this.buses.values()) {
      total += bus.listeners.size;
    }
    return total;
  }

  /**
   * Returns a list of model route names that currently have active subscribers.
   */
  get activeModels(): string[] {
    return [...this.buses.keys()];
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Strips hidden + writeOnly fields before sending a record over SSE.
 * Mirrors the same logic used in router.ts stripResponse.
 */
function stripFieldGuard(record: any, fg?: FieldGuardConfig): any {
  if (!fg || !record || typeof record !== "object") return record;
  const blocked = new Set([...(fg.hidden ?? []), ...(fg.writeOnly ?? [])]);
  if (blocked.size === 0) return record;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    if (!blocked.has(k)) out[k] = v;
  }
  return out;
}
