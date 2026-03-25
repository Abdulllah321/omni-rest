import { describe, it, expect } from "vitest";
import { buildQuery } from "../src/query-builder";

describe("buildQuery", () => {
  // ─── Exact match ───────────────────────────────────────────────────────────
  it("builds exact match filter for string", () => {
    const { where } = buildQuery(new URLSearchParams("name=John"));
    expect(where).toEqual({ name: "John" });
  });

  it("coerces numeric string to number for exact match", () => {
    const { where } = buildQuery(new URLSearchParams("age=25"));
    expect(where).toEqual({ age: 25 });
  });

  it("coerces boolean string true", () => {
    const { where } = buildQuery(new URLSearchParams("isActive=true"));
    expect(where).toEqual({ isActive: true });
  });

  it("coerces boolean string false", () => {
    const { where } = buildQuery(new URLSearchParams("isActive=false"));
    expect(where).toEqual({ isActive: false });
  });

  // ─── Operator filters ──────────────────────────────────────────────────────
  it("builds _contains filter", () => {
    const { where } = buildQuery(new URLSearchParams("name_contains=Jo"));
    expect(where).toEqual({ name: { contains: "Jo" } });
  });

  it("builds _gte filter", () => {
    const { where } = buildQuery(new URLSearchParams("age_gte=18"));
    expect(where).toEqual({ age: { gte: 18 } });
  });

  it("builds _lte filter", () => {
    const { where } = buildQuery(new URLSearchParams("price_lte=100"));
    expect(where).toEqual({ price: { lte: 100 } });
  });

  it("builds _in filter as array", () => {
    const { where } = buildQuery(new URLSearchParams("status_in=active,inactive,pending"));
    expect(where).toEqual({ status: { in: ["active", "inactive", "pending"] } });
  });

  it("builds _not filter", () => {
    const { where } = buildQuery(new URLSearchParams("status_not=deleted"));
    expect(where).toEqual({ status: { not: "deleted" } });
  });

  it("builds _startsWith filter", () => {
    const { where } = buildQuery(new URLSearchParams("code_startsWith=USR"));
    expect(where).toEqual({ code: { startsWith: "USR" } });
  });

  // ─── Pagination ────────────────────────────────────────────────────────────
  it("defaults to page 1 and limit 20", () => {
    const { skip, take } = buildQuery(new URLSearchParams(""));
    expect(skip).toBe(0);
    expect(take).toBe(20);
  });

  it("computes skip from page + limit", () => {
    const { skip, take } = buildQuery(new URLSearchParams("page=3&limit=10"));
    expect(skip).toBe(20);
    expect(take).toBe(10);
  });

  it("respects maxLimit", () => {
    const { take } = buildQuery(new URLSearchParams("limit=9999"), 20, 50);
    expect(take).toBe(50);
  });

  // ─── Sort ──────────────────────────────────────────────────────────────────
  it("builds orderBy from sort param", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=createdAt:desc"));
    expect(orderBy).toEqual({ createdAt: "desc" });
  });

  it("defaults sort direction to asc", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=name"));
    expect(orderBy).toEqual({ name: "asc" });
  });

  it("supports multiple sort fields", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=name:asc,createdAt:desc"));
    expect(orderBy).toEqual({ name: "asc", createdAt: "desc" });
  });

  // ─── Include / Select ──────────────────────────────────────────────────────
  it("parses include param", () => {
    const { include } = buildQuery(new URLSearchParams("include=posts,profile"));
    expect(include).toEqual({ posts: true, profile: true });
  });

  it("parses select param", () => {
    const { select } = buildQuery(new URLSearchParams("select=id,name,email"));
    expect(select).toEqual({ id: true, name: true, email: true });
  });

  it("returns null select when not specified", () => {
    const { select } = buildQuery(new URLSearchParams(""));
    expect(select).toBeNull();
  });
});