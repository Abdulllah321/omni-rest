import { describe, it, expect } from "vitest";
import { generateProvidersFile } from "../../../src/frontend/codegen/providers";
import type { GeneratorConfig } from "../../../src/frontend/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<GeneratorConfig> = {}): GeneratorConfig {
  return {
    frontendDir: "/app",
    schemaPath: "/app/prisma/schema.prisma",
    framework: "nextjs",
    baseUrl: "/api",
    outputDir: "/app/src",
    autopilot: false,
    models: [],
    staleTime: 30000,
    gcTime: 300000,
    noOptimistic: false,
    steps: "auto",
    ...overrides,
  };
}

// ─── 'use client' directive ───────────────────────────────────────────────────

describe("generateProvidersFile — 'use client' directive", () => {
  it("includes 'use client' as the first line", () => {
    const out = generateProvidersFile(makeConfig());
    const firstLine = out.split("\n")[0];
    expect(firstLine).toBe("'use client'");
  });
});

// ─── Imports ──────────────────────────────────────────────────────────────────

describe("generateProvidersFile — imports", () => {
  it("imports QueryClient and QueryClientProvider from @tanstack/react-query", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("import { QueryClient, QueryClientProvider } from '@tanstack/react-query'");
  });

  it("imports useState from react", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("import { useState } from 'react'");
  });
});

// ─── Component structure ──────────────────────────────────────────────────────

describe("generateProvidersFile — component structure", () => {
  it("exports a Providers function component", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("export function Providers(");
  });

  it("accepts children prop", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("{ children }: { children: React.ReactNode }");
  });

  it("creates QueryClient with useState", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("const [queryClient] = useState(() => new QueryClient(");
  });

  it("wraps children with QueryClientProvider", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("<QueryClientProvider client={queryClient}>");
    expect(out).toContain("{children}");
    expect(out).toContain("</QueryClientProvider>");
  });
});

// ─── Configuration ────────────────────────────────────────────────────────────

describe("generateProvidersFile — configuration", () => {
  it("uses staleTime from config", () => {
    const out = generateProvidersFile(makeConfig({ staleTime: 60000 }));
    expect(out).toContain("staleTime: 60000");
  });

  it("uses gcTime from config", () => {
    const out = generateProvidersFile(makeConfig({ gcTime: 600000 }));
    expect(out).toContain("gcTime: 600000");
  });

  it("uses default staleTime when not overridden", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("staleTime: 30000");
  });

  it("uses default gcTime when not overridden", () => {
    const out = generateProvidersFile(makeConfig());
    expect(out).toContain("gcTime: 300000");
  });
});
