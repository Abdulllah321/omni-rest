import type { GeneratorConfig, ModelConfig } from "../types";

/**
 * Generates the content of a `[Model]Table.tsx` DataTable component file.
 */
export function generateTableFile(
  config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { framework } = config;
  const { model, bulkDelete, canExport } = modelConfig;
  const { name } = model;

  // Derived names
  const Model = name;                                          // e.g. "User"
  const models = `${Model}s`;                                  // e.g. "Users"
  const varName = name.charAt(0).toLowerCase() + name.slice(1); // e.g. "user"

  // Hook names
  const useListHook = `use${models}`;                          // e.g. "useUsers"
  const useDeleteHook = `useDelete${Model}`;                   // e.g. "useDeleteUser"
  const useBulkDeleteHook = `useBulkDelete${models}`;          // e.g. "useBulkDeleteUsers"

  // Column variable name
  const columnsVar = `${varName}Columns`;                      // e.g. "userColumns"

  const lines: string[] = [];

  // 'use client' directive for Next.js (must be first line)
  if (framework === "nextjs") {
    lines.push(`'use client'`);
    lines.push(``);
  }

  // Build hook import list
  const hookImports: string[] = [useListHook, useDeleteHook];
  if (bulkDelete) {
    hookImports.push(useBulkDeleteHook);
  }

  // Imports - use relative paths for all frameworks
  lines.push(`import { useState } from "react";`);
  lines.push(`import DataTable from "../data-table";`);
  lines.push(`import { ${columnsVar} } from "./${Model}Columns";`);
  lines.push(`import { ${hookImports.join(", ")} } from "../../hooks/use${Model}";`);
  lines.push(`import { ${Model}Form } from "./${Model}Form";`);
  lines.push(`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";`);
  lines.push(``);

  // Component
  lines.push(`export function ${Model}Table() {`);
  lines.push(`  const [isCreateOpen, setIsCreateOpen] = useState(false);`);
  lines.push(`  const { data } = ${useListHook}();`);
  lines.push(`  const ${varName}Delete = ${useDeleteHook}();`);

  if (bulkDelete) {
    lines.push(`  const ${varName}BulkDelete = ${useBulkDeleteHook}();`);
  }

  lines.push(``);
  lines.push(`  return (`);
  lines.push(`    <>`);

  // Build DataTable props
  const dtProps: string[] = [
    `        title="${models}"`,
    `        description="Manage ${models.toLowerCase()} in your system"`,
    `        columns={${columnsVar}}`,
    `        data={data?.data ?? []}`,
    `        toggleAction={() => setIsCreateOpen(true)}`,
    `        actionText="Create ${Model}"`,
    `        onRowDelete={(row: any) => ${varName}Delete.mutate(row.id)}`,
  ];

  if (bulkDelete) {
    dtProps.push(`        onMultiDelete={(rows: any[]) => ${varName}BulkDelete.mutate(rows.map((r) => r.id))}`);
  }

  if (canExport) {
    dtProps.push(`        canExport={true}`);
  }

  lines.push(`      <DataTable`);
  for (const prop of dtProps) {
    lines.push(prop);
  }
  lines.push(`      />`);
  lines.push(``);

  // Add Dialog for create form
  lines.push(`      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>`);
  lines.push(`        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">`);
  lines.push(`          <DialogHeader>`);
  lines.push(`            <DialogTitle>Create New ${Model}</DialogTitle>`);
  lines.push(`            <DialogDescription>`);
  lines.push(`              Fill in the information below to create a new ${varName}.`);
  lines.push(`            </DialogDescription>`);
  lines.push(`          </DialogHeader>`);
  lines.push(`          <${Model}Form onSuccess={() => setIsCreateOpen(false)} />`);
  lines.push(`        </DialogContent>`);
  lines.push(`      </Dialog>`);
  lines.push(`    </>`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}
