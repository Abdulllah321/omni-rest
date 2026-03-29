import type { GeneratorConfig, ModelConfig } from "../types";

export function generatePageFile(_config: GeneratorConfig, modelConfig: ModelConfig): string {
  const { model } = modelConfig;
  const { name } = model;
  const modelLower = name.charAt(0).toLowerCase() + name.slice(1);
  const pluralName = name + "s";

  return [
    `'use client'`,
    ``,
    `import { ${name}Table } from '@/components/${modelLower}/${name}Table'`,
    ``,
    `export default function ${pluralName}Page() {`,
    `  return (`,
    `    <div className="container mx-auto py-10">`,
    `      <h1 className="text-3xl font-bold mb-6">${pluralName}</h1>`,
    `      <${name}Table />`,
    `    </div>`,
    `  )`,
    `}`,
    ``,
  ].join("\n");
}
