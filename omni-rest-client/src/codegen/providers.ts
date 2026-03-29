import type { GeneratorConfig } from "../types";

export function generateProvidersFile(config: GeneratorConfig): string {
  const { staleTime, gcTime } = config;
  return [
    `'use client'`,
    ``,
    `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`,
    `import { useState } from 'react'`,
    ``,
    `export function Providers({ children }: { children: React.ReactNode }) {`,
    `  const [queryClient] = useState(() => new QueryClient({`,
    `    defaultOptions: { queries: { staleTime: ${staleTime}, gcTime: ${gcTime} } },`,
    `  }))`,
    `  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>`,
    `}`,
    ``,
  ].join("\n");
}
