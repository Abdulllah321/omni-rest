import type { GeneratorConfig, ModelConfig } from "../types";

export function generateTableFile(config: GeneratorConfig, modelConfig: ModelConfig): string {
  const { framework } = config;
  const { model, bulkDelete, canExport } = modelConfig;
  const { name } = model;

  const Model = name;
  const models = `${Model}s`;
  const varName = name.charAt(0).toLowerCase() + name.slice(1);
  const columnsVar = `${varName}Columns`;

  const lines: string[] = [];

  if (framework === "nextjs") {
    lines.push(`'use client'`);
    lines.push(``);
  }

  const hookImports = [`use${models}`, `useDelete${Model}`];
  if (bulkDelete) hookImports.push(`useBulkDelete${models}`);

  lines.push(`import { useState } from "react";`);
  lines.push(`import DataTable from "../data-table";`);
  lines.push(`import { ${columnsVar} } from "./${Model}Columns";`);
  lines.push(`import { ${hookImports.join(", ")} } from "../../hooks/use${Model}";`);
  lines.push(`import { ${Model}Form } from "./${Model}Form";`);
  lines.push(`import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";`);
  lines.push(``);

  lines.push(`export function ${Model}Table() {`);
  lines.push(`  const [isCreateOpen, setIsCreateOpen] = useState(false);`);
  lines.push(`  const { data } = use${models}();`);
  lines.push(`  const ${varName}Delete = useDelete${Model}();`);
  if (bulkDelete) lines.push(`  const ${varName}BulkDelete = useBulkDelete${models}();`);
  lines.push(``);
  lines.push(`  return (`);
  lines.push(`    <>`);
  lines.push(`      <DataTable`);
  lines.push(`        title="${models}"`);
  lines.push(`        description="Manage ${models.toLowerCase()} in your system"`);
  lines.push(`        columns={${columnsVar}}`);
  lines.push(`        data={data?.data ?? []}`);
  lines.push(`        toggleAction={() => setIsCreateOpen(true)}`);
  lines.push(`        actionText="Create ${Model}"`);
  lines.push(`        onRowDelete={(row: any) => ${varName}Delete.mutate(row.id)}`);
  if (bulkDelete) lines.push(`        onMultiDelete={(rows: any[]) => ${varName}BulkDelete.mutate(rows.map((r) => r.id))}`);
  if (canExport) lines.push(`        canExport={true}`);
  lines.push(`      />`);
  lines.push(`      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>`);
  lines.push(`        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">`);
  lines.push(`          <DialogHeader>`);
  lines.push(`            <DialogTitle>Create New ${Model}</DialogTitle>`);
  lines.push(`            <DialogDescription>Fill in the information below to create a new ${varName}.</DialogDescription>`);
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
