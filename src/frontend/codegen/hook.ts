import type { GeneratorConfig, ModelConfig } from "../types";

/**
 * Generates the content of a `use[Model].ts` TanStack Query hook file.
 */
export function generateHookFile(
  config: GeneratorConfig,
  modelConfig: ModelConfig
): string {
  const { baseUrl, staleTime, gcTime, noOptimistic } = config;
  const { model, bulkDelete } = modelConfig;
  const { name, routeName } = model;

  // Capitalise first letter for hook names
  const Model = name; // e.g. "User"
  const models = `${Model}s`; // e.g. "Users"

  const lines: string[] = [];

  // Imports
  lines.push(`import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";`);
  lines.push(`import type { ${Model}, Prisma } from "@prisma/client";`);
  lines.push(``);

  // Base URL constant
  lines.push(`const BASE_URL = "${baseUrl}";`);
  lines.push(``);

  // ── use[Model]s ──────────────────────────────────────────────────────────
  lines.push(`export function use${models}(params?: Record<string, any>) {`);
  lines.push(`  return useQuery({`);
  lines.push(`    queryKey: ["${routeName}", params],`);
  lines.push(`    queryFn: () => {`);
  lines.push(`      const url = new URL(\`\${BASE_URL}/${routeName}\`, window.location.origin);`);
  lines.push(`      if (params) {`);
  lines.push(`        Object.entries(params).forEach(([k, v]) => {`);
  lines.push(`          if (v !== undefined && v !== null) url.searchParams.set(k, String(v));`);
  lines.push(`        });`);
  lines.push(`      }`);
  lines.push(`      return fetch(url.toString()).then((r) => r.json());`);
  lines.push(`    },`);
  lines.push(`    staleTime: ${staleTime},`);
  lines.push(`    gcTime: ${gcTime},`);
  lines.push(`  });`);
  lines.push(`}`);
  lines.push(``);

  // ── use[Model] ───────────────────────────────────────────────────────────
  lines.push(`export function use${Model}(id: string) {`);
  lines.push(`  return useQuery({`);
  lines.push(`    queryKey: ["${routeName}", id],`);
  lines.push(`    queryFn: () =>`);
  lines.push(`      fetch(\`\${BASE_URL}/${routeName}/\${id}\`).then((r) => r.json()),`);
  lines.push(`    staleTime: ${staleTime},`);
  lines.push(`    gcTime: ${gcTime},`);
  lines.push(`  });`);
  lines.push(`}`);
  lines.push(``);

  // ── useCreate[Model] ─────────────────────────────────────────────────────
  lines.push(`export function useCreate${Model}() {`);
  lines.push(`  const queryClient = useQueryClient();`);
  lines.push(`  return useMutation({`);
  lines.push(`    mutationFn: (data: Prisma.${Model}CreateInput) =>`);
  lines.push(`      fetch(\`\${BASE_URL}/${routeName}\`, {`);
  lines.push(`        method: "POST",`);
  lines.push(`        headers: { "Content-Type": "application/json" },`);
  lines.push(`        body: JSON.stringify(data),`);
  lines.push(`      }).then((r) => r.json()) as Promise<${Model}>,`);
  if (!noOptimistic) {
    lines.push(`    onMutate: async (newItem) => {`);
    lines.push(`      await queryClient.cancelQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`      const previous = queryClient.getQueryData(["${routeName}"]);`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], (old: any) => ({`);
    lines.push(`        ...old,`);
    lines.push(`        data: [...(old?.data ?? []), { ...newItem, id: "__optimistic__" }],`);
    lines.push(`      }));`);
    lines.push(`      return { previous };`);
    lines.push(`    },`);
    lines.push(`    onError: (_err, _vars, ctx) => {`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], ctx?.previous);`);
    lines.push(`    },`);
    lines.push(`    onSettled: () => {`);
    lines.push(`      queryClient.invalidateQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`    },`);
  }
  lines.push(`  });`);
  lines.push(`}`);
  lines.push(``);

  // ── useUpdate[Model] ─────────────────────────────────────────────────────
  lines.push(`export function useUpdate${Model}() {`);
  lines.push(`  const queryClient = useQueryClient();`);
  lines.push(`  return useMutation({`);
  lines.push(`    mutationFn: ({ id, data }: { id: string; data: Prisma.${Model}UpdateInput }) =>`);
  lines.push(`      fetch(\`\${BASE_URL}/${routeName}/\${id}\`, {`);
  lines.push(`        method: "PATCH",`);
  lines.push(`        headers: { "Content-Type": "application/json" },`);
  lines.push(`        body: JSON.stringify(data),`);
  lines.push(`      }).then((r) => r.json()) as Promise<${Model}>,`);
  if (!noOptimistic) {
    lines.push(`    onMutate: async ({ id, data }) => {`);
    lines.push(`      await queryClient.cancelQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`      const previous = queryClient.getQueryData(["${routeName}"]);`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], (old: any) => ({`);
    lines.push(`        ...old,`);
    lines.push(`        data: (old?.data ?? []).map((item: any) =>`);
    lines.push(`          item.id === id ? { ...item, ...data } : item`);
    lines.push(`        ),`);
    lines.push(`      }));`);
    lines.push(`      return { previous };`);
    lines.push(`    },`);
    lines.push(`    onError: (_err, _vars, ctx) => {`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], ctx?.previous);`);
    lines.push(`    },`);
    lines.push(`    onSettled: () => {`);
    lines.push(`      queryClient.invalidateQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`    },`);
  }
  lines.push(`  });`);
  lines.push(`}`);
  lines.push(``);

  // ── useDelete[Model] ─────────────────────────────────────────────────────
  lines.push(`export function useDelete${Model}() {`);
  lines.push(`  const queryClient = useQueryClient();`);
  lines.push(`  return useMutation({`);
  lines.push(`    mutationFn: (id: string) =>`);
  lines.push(`      fetch(\`\${BASE_URL}/${routeName}/\${id}\`, { method: "DELETE" }).then((r) =>`);
  lines.push(`        r.json()`);
  lines.push(`      ),`);
  if (!noOptimistic) {
    lines.push(`    onMutate: async (id) => {`);
    lines.push(`      await queryClient.cancelQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`      const previous = queryClient.getQueryData(["${routeName}"]);`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], (old: any) => ({`);
    lines.push(`        ...old,`);
    lines.push(`        data: (old?.data ?? []).filter((item: any) => item.id !== id),`);
    lines.push(`      }));`);
    lines.push(`      return { previous };`);
    lines.push(`    },`);
    lines.push(`    onError: (_err, _vars, ctx) => {`);
    lines.push(`      queryClient.setQueryData(["${routeName}"], ctx?.previous);`);
    lines.push(`    },`);
    lines.push(`    onSettled: () => {`);
    lines.push(`      queryClient.invalidateQueries({ queryKey: ["${routeName}"] });`);
    lines.push(`    },`);
  }
  lines.push(`  });`);
  lines.push(`}`);
  lines.push(``);

  // ── useBulkDelete[Model]s ────────────────────────────────────────────────
  if (bulkDelete !== false) {
    lines.push(`export function useBulkDelete${models}() {`);
    lines.push(`  const queryClient = useQueryClient();`);
    lines.push(`  return useMutation({`);
    lines.push(`    mutationFn: (ids: string[]) =>`);
    lines.push(`      fetch(\`\${BASE_URL}/${routeName}\`, {`);
    lines.push(`        method: "DELETE",`);
    lines.push(`        headers: { "Content-Type": "application/json" },`);
    lines.push(`        body: JSON.stringify({ ids }),`);
    lines.push(`      }).then((r) => r.json()),`);
    if (!noOptimistic) {
      lines.push(`    onMutate: async (ids) => {`);
      lines.push(`      await queryClient.cancelQueries({ queryKey: ["${routeName}"] });`);
      lines.push(`      const previous = queryClient.getQueryData(["${routeName}"]);`);
      lines.push(`      queryClient.setQueryData(["${routeName}"], (old: any) => ({`);
      lines.push(`        ...old,`);
      lines.push(`        data: (old?.data ?? []).filter((item: any) => !ids.includes(item.id)),`);
      lines.push(`      }));`);
      lines.push(`      return { previous };`);
      lines.push(`    },`);
      lines.push(`    onError: (_err, _vars, ctx) => {`);
      lines.push(`      queryClient.setQueryData(["${routeName}"], ctx?.previous);`);
      lines.push(`    },`);
      lines.push(`    onSettled: () => {`);
      lines.push(`      queryClient.invalidateQueries({ queryKey: ["${routeName}"] });`);
      lines.push(`    },`);
    }
    lines.push(`  });`);
    lines.push(`}`);
    lines.push(``);
  }

  return lines.join("\n");
}
