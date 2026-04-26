import type { ParsedQuery, FieldMeta } from "./types";

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
  "fields",
  "search",
]);

/**
 * Parses URLSearchParams into a full Prisma query object.
 *
 * Supports:
 *   Filtering       → ?name=John  ?age_gte=18  ?status_in=a,b
 *   Relation filter → ?employees.isActive=true  ?author.name_contains=john
 *   Sorting         → ?sort=createdAt:desc  or  ?sort=name:asc
 *   Pagination      → ?page=2&limit=10
 *   Relations       → ?include=posts,profile
 *   Fields          → ?select=id,name,email  or  ?fields=id,name,email
 *   Search          → ?search=eng  (queries all String fields with OR)
 *
 * Dot-notation relation filtering:
 *   ?relation.field=value   → isList  → { relation: { some: { field: value } } }
 *                           → singular → { relation: { field: value } }
 *   Operator suffixes work inside dot notation:
 *   ?author.name_contains=john → { author: { name: { contains: "john" } } }
 *
 * NOTE: Only one level of nesting is supported (relation.field).
 * Deeply nested filters (relation.nested.field) are not supported and will
 * be treated as a regular (non-relation) filter key.
 */
export function buildQuery(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100,
  modelFields?: FieldMeta[],
  defaultPaginationMode: "offset" | "cursor" = "offset"
): ParsedQuery {
  const where: Record<string, any> = {};
  const orderBy: Record<string, any> = {};
  let include: Record<string, boolean> = {};
  let select: Record<string, boolean> | null = null;
  let parsedCursor: Record<string, any> | undefined;

  // ─── Pagination ────────────────────────────────────────────────────────────
  const paginationMode =
    (searchParams.get("paginationMode") as "offset" | "cursor") ||
    defaultPaginationMode;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const rawLimit = parseInt(searchParams.get("limit") ?? String(defaultLimit));
  const take = Math.min(rawLimit, maxLimit);

  if (paginationMode === "cursor") {
    const cursorParam = searchParams.get("cursor");
    if (cursorParam) {
      try {
        parsedCursor = JSON.parse(Buffer.from(cursorParam, "base64").toString("utf-8"));
      } catch {
        // Invalid cursor format, ignore and treat as first page
      }
    }
  }

  // If in cursor mode with a valid cursor, we skip 1 (the cursor record itself).
  // Otherwise, use offset logic (skip = (page - 1) * take).
  const skip = paginationMode === "cursor" && parsedCursor ? 1 : (page - 1) * take;

  // ─── Sort ──────────────────────────────────────────────────────────────────
  const sortParam = searchParams.get("sort");
  if (sortParam) {
    // Supports multiple sorts: ?sort=name:asc,createdAt:desc,_count.posts:desc
    for (const part of sortParam.split(",")) {
      const [field, dir] = part.trim().split(":");
      if (!field) continue;
      const direction = dir === "desc" ? "desc" : "asc";

      // _count.relation:dir → { relation: { _count: dir } }
      if (field.startsWith("_count.")) {
        const relation = field.slice("_count.".length);
        if (relation) {
          orderBy[relation] = { _count: direction };
        }
      } else {
        orderBy[field] = direction;
      }
    }
  }

  // Ensure consistent sorting for cursor pagination if no sort is provided
  if (paginationMode === "cursor" && Object.keys(orderBy).length === 0 && modelFields) {
    const idField = modelFields.find((f) => f.isId)?.name ?? "id";
    orderBy[idField] = "asc";
  }

  // ─── Include (relations) ───────────────────────────────────────────────────
  const includeParam = searchParams.get("include");
  if (includeParam) {
    for (const rel of includeParam.split(",")) {
      if (rel.trim()) include[rel.trim()] = true;
    }
  }

  // ─── Select (fields) — ?select= or ?fields= alias ────────────────────────
  const selectParam = searchParams.get("select") ?? searchParams.get("fields");
  if (selectParam) {
    select = {};
    for (const field of selectParam.split(",")) {
      if (field.trim()) select[field.trim()] = true;
    }
  }

  // ─── Global search (?search=) ─────────────────────────────────────────────
  const searchValue = searchParams.get("search");
  if (searchValue && modelFields) {
    const stringFields = modelFields.filter(
      (f) => f.type === "String" && !f.isRelation
    );
    if (stringFields.length > 0) {
      const orClauses = stringFields.map((f) => ({
        [f.name]: { contains: searchValue, mode: "insensitive" },
      }));
      // Merge with any existing where via AND so other filters still apply
      where["OR"] = orClauses;
    }
  }

  // ─── Filters ───────────────────────────────────────────────────────────────
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_KEYS.has(key)) continue;

    // ── Dot-notation relation filter (?relation.field[_op]=value) ──────────
    // Only handle a single dot (one level deep). Deeper nesting falls through.
    const dotIndex = key.indexOf(".");
    if (dotIndex > 0 && key.indexOf(".", dotIndex + 1) === -1 && modelFields) {
      const relationName = key.slice(0, dotIndex);
      const fieldPart = key.slice(dotIndex + 1); // e.g. "isActive" or "name_contains"

      const relationMeta = modelFields.find(
        (f) => f.name === relationName && f.isRelation
      );

      if (relationMeta) {
        // Parse the field part for operator suffix
        const sortedOps = Object.keys(FILTER_OPERATORS).sort(
          (a, b) => b.length - a.length
        );
        let fieldName = fieldPart;
        let fieldFilter: any;

        let opMatched = false;
        for (const suffix of sortedOps) {
          if (fieldPart.endsWith(suffix)) {
            fieldName = fieldPart.slice(0, -suffix.length);
            const prismaOp = FILTER_OPERATORS[suffix];
            let parsedValue: any = value;

            if (prismaOp === "in" || prismaOp === "notIn") {
              parsedValue = value.split(",").map((v) => v.trim());
            } else if (!isNaN(Number(parsedValue)) && typeof parsedValue === "string") {
              parsedValue = Number(parsedValue);
            }

            const extra = suffix === "_icontains" ? { mode: "insensitive" } : {};
            fieldFilter = { [prismaOp]: parsedValue, ...extra };
            opMatched = true;
            break;
          }
        }

        if (!opMatched) {
          // Exact match — coerce value
          let parsedValue: any = value;
          if (value === "true") parsedValue = true;
          else if (value === "false") parsedValue = false;
          else if (!isNaN(Number(value)) && value !== "") parsedValue = Number(value);
          fieldFilter = parsedValue;
        }

        // isList relation → some: { field: filter }
        // singular relation → direct: { field: filter }
        const nested = { [fieldName]: fieldFilter };
        where[relationName] = relationMeta.isList
          ? { some: nested }
          : nested;

        continue; // skip regular filter processing for this key
      }
    }

    // ── Regular filters ────────────────────────────────────────────────────
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

  return {
    where,
    orderBy,
    skip,
    take,
    cursor: parsedCursor,
    paginationMode,
    include,
    select
  };
}