import type { FieldMeta } from "../../types";

/**
 * Converts a camelCase string to Title Case with spaces.
 * e.g. "firstName" → "First Name", "userId" → "User Id"
 */
export function camelToTitle(name: string): string {
  // Insert a space before each uppercase letter, then capitalize the first letter
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (ch) => ch.toUpperCase())
    .trim();
}

const VALID_FIELD_TYPES = [
  "text",
  "number",
  "switch",
  "date",
  "textarea",
  "select",
  "searchable-select",
] as const;

export type FormFieldType = (typeof VALID_FIELD_TYPES)[number];

/**
 * Maps a DMMF FieldMeta to a FormGenerator field type string.
 */
export function fieldTypeMap(field: FieldMeta): FormFieldType {
  if (field.isRelation) return "searchable-select";

  switch (field.type) {
    case "String":
      return "text";
    case "Int":
    case "Float":
    case "Decimal":
      return "number";
    case "Boolean":
      return "switch";
    case "DateTime":
      return "date";
    case "Json":
      return "textarea";
    default:
      // Enum types are not one of the scalar primitives above
      // We detect enums by checking if the type starts with an uppercase letter
      // and is not a known scalar — treat as "select"
      if (/^[A-Z]/.test(field.type)) return "select";
      return "text";
  }
}

/**
 * Splits a string[] into arrays of at most `maxPerStep` items.
 * Number of steps = ceil(fields.length / maxPerStep).
 */
export function chunkFields(fields: string[], maxPerStep = 4): string[][] {
  const steps: string[][] = [];
  for (let i = 0; i < fields.length; i += maxPerStep) {
    steps.push(fields.slice(i, i + maxPerStep));
  }
  return steps;
}
