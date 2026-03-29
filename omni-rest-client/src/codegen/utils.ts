import type { FieldMeta } from "../types";

export function camelToTitle(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (ch) => ch.toUpperCase())
    .trim();
}

export type FormFieldType = "text" | "number" | "switch" | "date" | "textarea" | "select" | "searchable-select";

export function fieldTypeMap(field: FieldMeta): FormFieldType {
  if (field.isRelation) return "searchable-select";
  switch (field.type) {
    case "String": return "text";
    case "Int": case "Float": case "Decimal": return "number";
    case "Boolean": return "switch";
    case "DateTime": return "date";
    case "Json": return "textarea";
    default:
      if (/^[A-Z]/.test(field.type)) return "select";
      return "text";
  }
}

export function chunkFields(fields: string[], maxPerStep = 4): string[][] {
  const steps: string[][] = [];
  for (let i = 0; i < fields.length; i += maxPerStep) {
    steps.push(fields.slice(i, i + maxPerStep));
  }
  return steps;
}
