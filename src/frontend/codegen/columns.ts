import type { GeneratorConfig, ModelConfig } from "../types";
import { camelToTitle } from "./utils";

/**
 * Generates the content of a `[Model]Columns.tsx` TanStack Table column definitions file.
 */
export function generateColumnsFile(
  _config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { model, tableFields } = modelConfig;
  const { name } = model;

  // e.g. "User" → "user"
  const varName = name.charAt(0).toLowerCase() + name.slice(1);

  const lines: string[] = [];

  // Imports
  lines.push(`import type { ColumnDef } from "@tanstack/react-table";`);
  lines.push(`import type { ${name} } from "@prisma/client";`);
  lines.push(``);

  // Column array
  lines.push(`export const ${varName}Columns: ColumnDef<${name}>[] = [`);

  // One entry per selected scalar field
  for (const field of tableFields) {
    lines.push(`  {`);
    lines.push(`    accessorKey: "${field}",`);
    lines.push(`    header: "${camelToTitle(field)}",`);
    lines.push(`  },`);
  }

  // Actions column
  lines.push(`  {`);
  lines.push(`    id: "actions",`);
  lines.push(`    header: "Actions",`);
  lines.push(`    cell: ({ row }) => (`);
  lines.push(`      <div className="flex gap-2">`);
  lines.push(`        <button onClick={() => row.original && void 0}>Edit</button>`);
  lines.push(`        <button onClick={() => row.original && void 0}>Delete</button>`);
  lines.push(`      </div>`);
  lines.push(`    ),`);
  lines.push(`  },`);

  lines.push(`];`);
  lines.push(``);

  return lines.join("\n");
}
