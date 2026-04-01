import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPrisma } from "./fixtures/mockPrisma";
import { createRouter } from "../src/router";

describe("fieldGuards", () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
    // Make user delegate return a record with sensitive fields
    prisma.user.findUnique.mockResolvedValue({
      id: 1, name: "Alice", email: "alice@test.com",
      password: "hashed", salt: "abc", createdAt: "2024-01-01",
    });
    prisma.user.findMany.mockResolvedValue([{
      id: 1, name: "Alice", email: "alice@test.com",
      password: "hashed", salt: "abc", createdAt: "2024-01-01",
    }]);
    prisma.user.create.mockResolvedValue({
      id: 2, name: "Bob", email: "bob@test.com",
      password: "hashed2", salt: "def", createdAt: "2024-01-01",
    });
    prisma.user.update.mockResolvedValue({
      id: 1, name: "Alice Updated", email: "alice@test.com",
      password: "hashed", salt: "abc", createdAt: "2024-01-01",
    });
  });

  const options = {
    fieldGuards: {
      user: {
        hidden: ["salt"],
        readOnly: ["id", "createdAt"],
        writeOnly: ["password"],
      },
    },
  };

  // ─── hidden ───────────────────────────────────────────────────────────────
  it("hidden field absent from GET single", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data).not.toHaveProperty("salt");
  });

  it("hidden field absent from GET list", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.status).toBe(200);
    expect(res.data.data[0]).not.toHaveProperty("salt");
  });

  it("hidden field absent from POST response", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("POST", "user", null, { name: "Bob", email: "b@test.com", password: "pw" }, new URLSearchParams());
    expect(res.status).toBe(201);
    expect(res.data).not.toHaveProperty("salt");
  });

  // ─── writeOnly ────────────────────────────────────────────────────────────
  it("writeOnly field absent from GET single response", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.data).not.toHaveProperty("password");
  });

  it("writeOnly field absent from GET list response", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(res.data.data[0]).not.toHaveProperty("password");
  });

  it("writeOnly field absent from PUT response", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("PUT", "user", "1", { name: "Alice Updated" }, new URLSearchParams());
    expect(res.data).not.toHaveProperty("password");
  });

  // ─── readOnly ─────────────────────────────────────────────────────────────
  it("readOnly fields stripped from POST body before Prisma call", async () => {
    const { handle } = createRouter(prisma as any, options);
    await handle("POST", "user", null, { id: 99, name: "Bob", createdAt: "2020-01-01" }, new URLSearchParams());
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ id: 99, createdAt: "2020-01-01" }),
      })
    );
  });

  it("readOnly fields stripped from PUT body before Prisma call", async () => {
    const { handle } = createRouter(prisma as any, options);
    await handle("PUT", "user", "1", { id: 1, name: "Alice", createdAt: "2020-01-01" }, new URLSearchParams());
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ id: 1, createdAt: "2020-01-01" }),
      })
    );
  });

  // ─── unguarded fields unaffected ──────────────────────────────────────────
  it("fields not in fieldGuards are returned normally", async () => {
    const { handle } = createRouter(prisma as any, options);
    const res = await handle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.data).toHaveProperty("name");
    expect(res.data).toHaveProperty("email");
  });

  // ─── no fieldGuards — no change ───────────────────────────────────────────
  it("all fields returned when no fieldGuards configured", async () => {
    const { handle } = createRouter(prisma as any);
    const res = await handle("GET", "user", "1", {}, new URLSearchParams());
    expect(res.data).toHaveProperty("password");
    expect(res.data).toHaveProperty("salt");
  });

  // ─── envelope: false still strips ─────────────────────────────────────────
  it("hidden fields stripped when envelope: false", async () => {
    const { handle } = createRouter(prisma as any, { ...options, envelope: false });
    const res = await handle("GET", "user", null, {}, new URLSearchParams());
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).not.toHaveProperty("salt");
    expect(res.data[0]).not.toHaveProperty("password");
  });
});
