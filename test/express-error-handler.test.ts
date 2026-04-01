import { describe, it, expect, vi } from "vitest";
import { omniRestErrorHandler } from "../src/adapters/express";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function callHandler(err: any) {
  const handler = omniRestErrorHandler();
  const res = makeRes();
  const next = vi.fn();
  handler(err, {}, res, next);
  return { res, next };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("omniRestErrorHandler", () => {
  it("maps P2025 to 404", () => {
    const { res } = callHandler({ code: "P2025" });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Record not found." });
  });

  it("maps P2002 to 409 with field name", () => {
    const { res } = callHandler({ code: "P2002", meta: { target: "email" } });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("email") })
    );
  });

  it("maps P2002 to 409 with fallback when meta missing", () => {
    const { res } = callHandler({ code: "P2002" });
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("maps P2003 to 400", () => {
    const { res } = callHandler({ code: "P2003" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Foreign key constraint failed." });
  });

  it("maps P2014 to 400", () => {
    const { res } = callHandler({ code: "P2014" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Relation violation." });
  });

  it("maps unknown Prisma code to 500", () => {
    const { res } = callHandler({ code: "P9999", message: "Something went wrong" });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Something went wrong" });
  });

  it("passes non-Prisma errors through to next()", () => {
    const err = new Error("generic error");
    const { next, res } = callHandler(err);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns a function (middleware factory)", () => {
    expect(typeof omniRestErrorHandler()).toBe("function");
    expect(omniRestErrorHandler()).toHaveLength(4); // Express error middleware has 4 args
  });
});
