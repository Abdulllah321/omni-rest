import { describe, it, expect } from "vitest";
import { buildQuery } from "../src/query-builder";
import type { FieldMeta } from "../src/types";

// ─── Shared field fixtures ─────────────────────────────────────────────────
const makeField = (name: string, type: string, isRelation = false): FieldMeta => ({
  name,
  type,
  isId: false,
  isRequired: true,
  isList: false,
  isRelation,
  hasDefaultValue: false,
  isUpdatedAt: false,
});

const departmentFields: FieldMeta[] = [
  { ...makeField("id", "Int"), isId: true },
  makeField("name", "String"),
  makeField("code", "String"),
  makeField("description", "String"),
  makeField("headCount", "Int"),
  makeField("isActive", "Boolean"),
  // list relation
  { ...makeField("employees", "User", true), isList: true },
];

// Fields for a model with a singular relation
const orderFields: FieldMeta[] = [
  { ...makeField("id", "Int"), isId: true },
  makeField("total", "Int"),
  // singular relation
  { ...makeField("customer", "Customer", true), isList: false },
];

const noStringFields: FieldMeta[] = [
  { ...makeField("id", "Int"), isId: true },
  makeField("count", "Int"),
  makeField("isActive", "Boolean"),
];

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

  // ─── _count sort ──────────────────────────────────────────────────────────
  it("builds _count.relation:desc orderBy", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=_count.posts:desc"));
    expect(orderBy).toEqual({ posts: { _count: "desc" } });
  });

  it("builds _count.relation:asc orderBy", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=_count.employees:asc"));
    expect(orderBy).toEqual({ employees: { _count: "asc" } });
  });

  it("defaults _count direction to asc when omitted", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=_count.posts"));
    expect(orderBy).toEqual({ posts: { _count: "asc" } });
  });

  it("mixes _count sort with regular sort fields", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=_count.posts:desc,name:asc"));
    expect(orderBy).toEqual({ posts: { _count: "desc" }, name: "asc" });
  });

  it("treats bare _count (no dot) as a regular field", () => {
    const { orderBy } = buildQuery(new URLSearchParams("sort=_count:desc"));
    expect(orderBy).toEqual({ _count: "desc" });
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

  // ─── ?fields= alias for ?select= ──────────────────────────────────────────
  it("?fields= produces same output as ?select=", () => {
    const fromSelect = buildQuery(new URLSearchParams("select=id,name,email"));
    const fromFields = buildQuery(new URLSearchParams("fields=id,name,email"));
    expect(fromFields.select).toEqual(fromSelect.select);
  });

  it("?select= takes precedence when both ?select= and ?fields= are provided", () => {
    const { select } = buildQuery(new URLSearchParams("select=id,name&fields=email"));
    expect(select).toEqual({ id: true, name: true });
  });

  // ─── ?search= global search ────────────────────────────────────────────────
  describe("?search=", () => {
    it("builds OR across all String fields", () => {
      const { where } = buildQuery(
        new URLSearchParams("search=eng"),
        20,
        100,
        departmentFields
      );
      expect(where.OR).toEqual([
        { name: { contains: "eng", mode: "insensitive" } },
        { code: { contains: "eng", mode: "insensitive" } },
        { description: { contains: "eng", mode: "insensitive" } },
      ]);
    });

    it("is case-insensitive by default", () => {
      const { where } = buildQuery(
        new URLSearchParams("search=ENG"),
        20,
        100,
        departmentFields
      );
      expect(where.OR[0]).toMatchObject({ name: { mode: "insensitive" } });
    });

    it("is a no-op when model has no String fields", () => {
      const { where } = buildQuery(
        new URLSearchParams("search=anything"),
        20,
        100,
        noStringFields
      );
      expect(where.OR).toBeUndefined();
    });

    it("is a no-op when no modelFields are provided", () => {
      const { where } = buildQuery(new URLSearchParams("search=eng"));
      expect(where.OR).toBeUndefined();
    });

    it("combines with other filters", () => {
      const { where } = buildQuery(
        new URLSearchParams("search=eng&isActive=true"),
        20,
        100,
        departmentFields
      );
      expect(where.isActive).toBe(true);
      expect(where.OR).toHaveLength(3);
    });

    it("does not treat 'search' as a filter field", () => {
      const { where } = buildQuery(
        new URLSearchParams("search=eng"),
        20,
        100,
        departmentFields
      );
      expect(where.search).toBeUndefined();
    });
  });
});

// ─── Dot-notation relation filters ────────────────────────────────────────────

describe("dot-notation relation filtering", () => {
  it("list relation uses some: {} wrapper", () => {
    const { where } = buildQuery(
      new URLSearchParams("employees.isActive=true"),
      20, 100, departmentFields
    );
    expect(where.employees).toEqual({ some: { isActive: true } });
  });

  it("singular relation uses direct nesting", () => {
    const { where } = buildQuery(
      new URLSearchParams("customer.city=Karachi"),
      20, 100, orderFields
    );
    expect(where.customer).toEqual({ city: "Karachi" });
  });

  it("relation + _contains operator on singular relation", () => {
    const fields: FieldMeta[] = [
      { ...makeField("id", "Int"), isId: true },
      { ...makeField("author", "User", true), isList: false },
    ];
    const { where } = buildQuery(
      new URLSearchParams("author.name_contains=john"),
      20, 100, fields
    );
    expect(where.author).toEqual({ name: { contains: "john" } });
  });

  it("relation + _gte operator on list relation", () => {
    const fields: FieldMeta[] = [
      { ...makeField("id", "Int"), isId: true },
      { ...makeField("posts", "Post", true), isList: true },
    ];
    const { where } = buildQuery(
      new URLSearchParams("posts.views_gte=100"),
      20, 100, fields
    );
    expect(where.posts).toEqual({ some: { views: { gte: 100 } } });
  });

  it("combines with regular filters", () => {
    const { where } = buildQuery(
      new URLSearchParams("employees.isActive=true&name=Engineering"),
      20, 100, departmentFields
    );
    expect(where.employees).toEqual({ some: { isActive: true } });
    expect(where.name).toBe("Engineering");
  });

  it("ignores dot-notation when relation name not found in modelFields", () => {
    const { where } = buildQuery(
      new URLSearchParams("unknown.field=value"),
      20, 100, departmentFields
    );
    expect(where["unknown.field"]).toBe("value");
  });

  it("ignores dot-notation when no modelFields provided", () => {
    const { where } = buildQuery(new URLSearchParams("employees.isActive=true"));
    expect(where["employees.isActive"]).toBe(true);
  });

  it("does not process deeply nested keys (two dots)", () => {
    const { where } = buildQuery(
      new URLSearchParams("posts.comments.text=hello"),
      20, 100, departmentFields
    );
    expect(where["posts.comments.text"]).toBe("hello");
  });
});
