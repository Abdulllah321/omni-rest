import type { GeneratorConfig, ModelConfig } from "../types";
import { camelToTitle, fieldTypeMap, chunkFields } from "./utils";

/**
 * Generates the content of a `[Model]Form.tsx` FormGenerator component file.
 */
export function generateFormFile(
  config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { framework } = config;
  const { model, formFields, relationalFields, multiStep } = modelConfig;
  const { name, fields: allFields } = model;

  const lines: string[] = [];

  // 'use client' directive for Next.js (must be first line)
  if (framework === "nextjs") {
    lines.push(`'use client'`);
    lines.push(``);
  }

  // Collect relational field metadata: fieldName → relatedModelName
  const relationalFieldMeta: Array<{ fieldName: string; relatedModel: string }> = [];
  for (const relFieldName of relationalFields) {
    const fieldMeta = allFields.find((f) => f.name === relFieldName);
    if (fieldMeta) {
      relationalFieldMeta.push({
        fieldName: relFieldName,
        relatedModel: fieldMeta.type, // e.g. "User" for a userId relation
      });
    }
  }

  // Imports - use relative paths for all frameworks
  lines.push(`import { FormGenerator } from "../form-generator";`);
  lines.push(`import { ${name}CreateSchema } from "../../src/schemas.generated";`);
  lines.push(
    `import { useCreate${name}, useUpdate${name} } from "../../hooks/use${name}";`
  );

  // Import use[RelatedModel]s hooks for relational fields
  for (const { relatedModel } of relationalFieldMeta) {
    lines.push(
      `import { use${relatedModel}s } from "../../hooks/use${relatedModel}";`
    );
  }

  lines.push(``);

  // Component
  lines.push(`export function ${name}Form({ id, onSuccess }: { id?: string; onSuccess?: () => void }) {`);
  lines.push(`  const create${name} = useCreate${name}();`);
  lines.push(`  const update${name} = useUpdate${name}();`);

  // Fetch relational data for searchable-select options
  for (const { fieldName, relatedModel } of relationalFieldMeta) {
    const varName =
      fieldName.charAt(0).toLowerCase() + fieldName.slice(1) + "Options";
    lines.push(
      `  const { data: ${varName}Data } = use${relatedModel}s();`
    );
  }

  lines.push(``);

  // Build fields array
  lines.push(`  const fields = [`);

  // Scalar form fields
  for (const fieldName of formFields) {
    const fieldMeta = allFields.find((f) => f.name === fieldName);
    const type = fieldMeta ? fieldTypeMap(fieldMeta) : "text";
    lines.push(`    {`);
    lines.push(`      name: "${fieldName}",`);
    lines.push(`      label: "${camelToTitle(fieldName)}",`);
    lines.push(`      type: "${type}",`);
    lines.push(`    },`);
  }

  // Relational fields as searchable-select
  for (const { fieldName, relatedModel } of relationalFieldMeta) {
    const varName =
      fieldName.charAt(0).toLowerCase() + fieldName.slice(1) + "Options";
    lines.push(`    {`);
    lines.push(`      name: "${fieldName}",`);
    lines.push(`      label: "${camelToTitle(fieldName)}",`);
    lines.push(`      type: "searchable-select",`);
    lines.push(
      `      options: (${varName}Data?.data ?? []).map((r: any) => ({ label: String(r.name ?? r.id), value: String(r.id) })),`
    );
    lines.push(`    },`);
  }

  lines.push(`  ];`);
  lines.push(``);

  // Build FormGenerator JSX
  if (multiStep) {
    // Chunk all field names (scalar + relational) into steps
    const allFieldNames = [
      ...formFields,
      ...relationalFieldMeta.map((r) => r.fieldName),
    ];
    const chunks = chunkFields(allFieldNames, 4);

    lines.push(`  const steps = [`);
    chunks.forEach((chunk, i) => {
      lines.push(`    {`);
      lines.push(`      title: "Step ${i + 1}",`);
      lines.push(
        `      fields: [${chunk.map((f) => `"${f}"`).join(", ")}],`
      );
      lines.push(`    },`);
    });
    lines.push(`  ];`);
    lines.push(``);

    lines.push(`  const handleSubmit = (data: any) => {`);
    lines.push(`    const mutation = id ? update${name}.mutate({ id, data }) : create${name}.mutate(data);`);
    lines.push(`    if (onSuccess) {`);
    lines.push(`      // Call onSuccess after mutation completes`);
    lines.push(`      Promise.resolve(mutation).then(() => onSuccess()).catch(() => {});`);
    lines.push(`    }`);
    lines.push(`  };`);
    lines.push(``);

    lines.push(`  return (`);
    lines.push(`    <FormGenerator`);
    lines.push(`      fields={fields}`);
    lines.push(`      schema={${name}CreateSchema}`);
    lines.push(`      onSubmit={handleSubmit}`);
    lines.push(`      steps={steps}`);
    lines.push(`    />`);
    lines.push(`  );`);
  } else {
    lines.push(`  const handleSubmit = (data: any) => {`);
    lines.push(`    const mutation = id ? update${name}.mutate({ id, data }) : create${name}.mutate(data);`);
    lines.push(`    if (onSuccess) {`);
    lines.push(`      // Call onSuccess after mutation completes`);
    lines.push(`      Promise.resolve(mutation).then(() => onSuccess()).catch(() => {});`);
    lines.push(`    }`);
    lines.push(`  };`);
    lines.push(``);

    lines.push(`  return (`);
    lines.push(`    <FormGenerator`);
    lines.push(`      fields={fields}`);
    lines.push(`      schema={${name}CreateSchema}`);
    lines.push(`      onSubmit={handleSubmit}`);
    lines.push(`    />`);
    lines.push(`  );`);
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}
