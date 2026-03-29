import type { GeneratorConfig, ModelConfig } from "../types";
import { camelToTitle } from "./utils";

/**
 * Generates [Model]Columns.tsx — no @prisma/client dep, uses generic Record type.
 */
export function generateColumnsFile(
  _config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { model, tableFields } = modelConfig;
  const { name } = model;
  const varName = name.charAt(0).toLowerCase() + name.slice(1);

  const lines: string[] = [];

  lines.push(`import type { ColumnDef } from "@tanstack/react-table";`);
  lines.push(``);
  lines.push(`type ${name} = Record<string, any>;`);
  lines.push(``);
  lines.push(`export const ${varName}Columns: ColumnDef<${name}>[] = [`);

  for (const field of tableFields) {
    lines.push(`  {`);
    lines.push(`    accessorKey: "${field}",`);
    lines.push(`    header: "${camelToTitle(field)}",`);
    lines.push(`  },`);
  }

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
