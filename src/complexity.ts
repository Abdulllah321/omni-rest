import type { ParsedQuery, ComplexityRules } from "./types";

/**
 * Scores a parsed query based on the provided complexity rules.
 */
export function scoreQuery(
  parsedQuery: ParsedQuery,
  rules: ComplexityRules
): number {
  let score = 0;

  if (rules.perInclude && parsedQuery.include) {
    score += Object.keys(parsedQuery.include).length * rules.perInclude;
  }

  if (rules.perFilter && parsedQuery.where) {
    // Approximate count of top-level filter keys (excludes OR, AND, etc. for simplicity, 
    // but counts them as 1 top-level key which is fine for basic scoring)
    const filterCount = Object.keys(parsedQuery.where).filter(
      (k) => k !== "OR" && k !== "AND" && k !== "NOT"
    ).length;
    score += filterCount * rules.perFilter;
  }

  if (rules.perSort && parsedQuery.orderBy) {
    score += Object.keys(parsedQuery.orderBy).length * rules.perSort;
  }

  if (rules.perLimit100 && parsedQuery.take) {
    score += Math.ceil(parsedQuery.take / 100) * rules.perLimit100;
  }

  return score;
}
