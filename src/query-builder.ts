import type { ParsedQuery } from "./types";

/**
 * Supported filter suffixes and their Prisma equivalents.
 *
 * Usage in URL:
 *   ?name_contains=john
 *   ?age_gte=18
 *   ?status_in=active,inactive
 *   ?email_not=test@test.com
 */
const FILTER_OPERATORS: Record<string, string> = {
  _gte: "gte",
  _lte: "lte",
  _gt: "gt",
  _lt: "lt",
  _contains: "contains",
  _icontains: "contains",   // case-insensitive version (mode: insensitive)
  _startsWith: "startsWith",
  _endsWith: "endsWith",
  _in: "in",
  _notIn: "notIn",
  _not: "not",
};

/**
 * Reserved query keys — these are NOT treated as filters.
 */
const RESERVED_KEYS = new Set([
  "page",
  "limit",
  "sort",
  "include",
  "select",
]);

/**
 * Parses URLSearchParams into a full Prisma query object.
 *
 * Supports:
 *   Filtering  → ?name=John  ?age_gte=18  ?status_in=a,b
 *   Sorting    → ?sort=createdAt:desc  or  ?sort=name:asc
 *   Pagination → ?page=2&limit=10
 *   Relations  → ?include=posts,profile
 *   Fields     → ?select=id,name,email
 */
export function buildQuery(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): ParsedQuery {
  const where: Record<string, any> = {};
  const orderBy: Record<string, "asc" | "desc"> = {};
  let include: Record<string, boolean> = {};
  let select: Record<string, boolean> | null = null;

  // ─── Pagination ────────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const rawLimit = parseInt(searchParams.get("limit") ?? String(defaultLimit));
  const take = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * take;

  // ─── Sort ──────────────────────────────────────────────────────────────────
  const sortParam = searchParams.get("sort");
  if (sortParam) {
    // Supports multiple sorts: ?sort=name:asc,createdAt:desc
    for (const part of sortParam.split(",")) {
      const [field, dir] = part.trim().split(":");
      if (field) {
        orderBy[field] = (dir === "desc" ? "desc" : "asc");
      }
    }
  }

  // ─── Include (relations) ───────────────────────────────────────────────────
  const includeParam = searchParams.get("include");
  if (includeParam) {
    for (const rel of includeParam.split(",")) {
      if (rel.trim()) include[rel.trim()] = true;
    }
  }

  // ─── Select (fields) ──────────────────────────────────────────────────────
  const selectParam = searchParams.get("select");
  if (selectParam) {
    select = {};
    for (const field of selectParam.split(",")) {
      if (field.trim()) select[field.trim()] = true;
    }
  }

  // ─── Filters ───────────────────────────────────────────────────────────────
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_KEYS.has(key)) continue;

    // Check operator suffixes (longest match first)
    let matched = false;
    const sortedOps = Object.keys(FILTER_OPERATORS).sort(
      (a, b) => b.length - a.length
    );

    for (const suffix of sortedOps) {
      if (key.endsWith(suffix)) {
        const field = key.slice(0, -suffix.length);
        const prismaOp = FILTER_OPERATORS[suffix];

        let parsedValue: any = value;

        // Parse arrays
        if (prismaOp === "in" || prismaOp === "notIn") {
          parsedValue = value.split(",").map((v) => v.trim());
        }

        // Attempt numeric coercion
        if (!isNaN(Number(parsedValue)) && typeof parsedValue === "string") {
          parsedValue = Number(parsedValue);
        }

        // Case-insensitive flag
        const extra = suffix === "_icontains" ? { mode: "insensitive" } : {};

        where[field] = { [prismaOp]: parsedValue, ...extra };
        matched = true;
        break;
      }
    }

    // No operator — exact match
    if (!matched) {
      let parsedValue: any = value;

      // Coerce booleans
      if (value === "true") parsedValue = true;
      else if (value === "false") parsedValue = false;
      // Coerce numbers
      else if (!isNaN(Number(value)) && value !== "") {
        parsedValue = Number(value);
      }

      where[key] = parsedValue;
    }
  }

  return { where, orderBy, skip, take, include, select };
}