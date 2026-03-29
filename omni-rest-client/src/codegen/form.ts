import type { GeneratorConfig, ModelConfig } from "../types";
import { camelToTitle, fieldTypeMap, chunkFields } from "./utils";

/**
 * Generates [Model]Form.tsx — imports zod schema from the generated schemas file,
 * not from @prisma/client.
 */
export function generateFormFile(
  config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { framework } = config;
  const { model, formFields, relationalFields, multiStep } = modelConfig;
  const { name, fields: allFields } = model;

  const lines: string[] = [];

  if (framework === "nextjs") {
    lines.push(`'use client'`);
    lines.push(``);
  }

  const relationalFieldMeta: Array<{ fieldName: string; relatedModel: string }> = [];
  for (const relFieldName of relationalFields) {
    const fieldMeta = allFields.find((f) => f.name === relFieldName);
    if (fieldMeta) {
      relationalFieldMeta.push({ fieldName: relFieldName, relatedModel: fieldMeta.type });
    }
  }

  lines.push(`import { FormGenerator } from "../form-generator";`);
  // Import from the generated schemas file (written by omni-rest generate:config)
  lines.push(`import { ${name}CreateSchema } from "../../schemas.generated";`);
  lines.push(`import { useCreate${name}, useUpdate${name} } from "../../hooks/use${name}";`);

  for (const { relatedModel } of relationalFieldMeta) {
    lines.push(`import { use${relatedModel}s } from "../../hooks/use${relatedModel}";`);
  }

  lines.push(``);
  lines.push(`export function ${name}Form({ id, onSuccess }: { id?: string; onSuccess?: () => void }) {`);
  lines.push(`  const create${name} = useCreate${name}();`);
  lines.push(`  const update${name} = useUpdate${name}();`);

  for (const { fieldName, relatedModel } of relationalFieldMeta) {
    const varName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1) + "Options";
    lines.push(`  const { data: ${varName}Data } = use${relatedModel}s();`);
  }

  lines.push(``);
  lines.push(`  const fields = [`);

  for (const fieldName of formFields) {
    const fieldMeta = allFields.find((f) => f.name === fieldName);
    const type = fieldMeta ? fieldTypeMap(fieldMeta) : "text";
    lines.push(`    { name: "${fieldName}", label: "${camelToTitle(fieldName)}", type: "${type}" },`);
  }

  for (const { fieldName, relatedModel: _relatedModel } of relationalFieldMeta) {
    const varName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1) + "Options";
    lines.push(`    {`);
    lines.push(`      name: "${fieldName}",`);
    lines.push(`      label: "${camelToTitle(fieldName)}",`);
    lines.push(`      type: "searchable-select",`);
    lines.push(`      options: (${varName}Data?.data ?? []).map((r: any) => ({ label: String(r.name ?? r.id), value: String(r.id) })),`);
    lines.push(`    },`);
  }

  lines.push(`  ];`);
  lines.push(``);

  const handleSubmit = [
    `  const handleSubmit = (data: any) => {`,
    `    const mutation = id ? update${name}.mutate({ id, data }) : create${name}.mutate(data);`,
    `    if (onSuccess) {`,
    `      Promise.resolve(mutation).then(() => onSuccess()).catch(() => {});`,
    `    }`,
    `  };`,
    ``,
  ];

  if (multiStep) {
    const allFieldNames = [...formFields, ...relationalFieldMeta.map((r) => r.fieldName)];
    const chunks = chunkFields(allFieldNames, 4);
    lines.push(`  const steps = [`);
    chunks.forEach((chunk, i) => {
      lines.push(`    { title: "Step ${i + 1}", fields: [${chunk.map((f) => `"${f}"`).join(", ")}] },`);
    });
    lines.push(`  ];`);
    lines.push(``);
    lines.push(...handleSubmit);
    lines.push(`  return <FormGenerator fields={fields} schema={${name}CreateSchema} onSubmit={handleSubmit} steps={steps} />;`);
  } else {
    lines.push(...handleSubmit);
    lines.push(`  return <FormGenerator fields={fields} schema={${name}CreateSchema} onSubmit={handleSubmit} />;`);
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}
