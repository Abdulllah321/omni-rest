import type { GeneratorConfig } from "../types";

/**
 * Generates the content of a `providers.tsx` file for React Query setup.
 * This is needed for Next.js App Router to wrap the app with QueryClientProvider.
 */
export function generateProvidersFile(config: GeneratorConfig): string {
  const { staleTime, gcTime } = config;

  const lines: string[] = [];

  lines.push(`'use client'`);
  lines.push(``);
  lines.push(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`);
  lines.push(`import { useState } from 'react'`);
  lines.push(``);
  lines.push(`export function Providers({ children }: { children: React.ReactNode }) {`);
  lines.push(`  const [queryClient] = useState(() => new QueryClient({`);
  lines.push(`    defaultOptions: {`);
  lines.push(`      queries: {`);
  lines.push(`        staleTime: ${staleTime},`);
  lines.push(`        gcTime: ${gcTime},`);
  lines.push(`      },`);
  lines.push(`    },`);
  lines.push(`  }))`);
  lines.push(``);
  lines.push(`  return (`);
  lines.push(`    <QueryClientProvider client={queryClient}>`);
  lines.push(`      {children}`);
  lines.push(`    </QueryClientProvider>`);
  lines.push(`  )`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}
