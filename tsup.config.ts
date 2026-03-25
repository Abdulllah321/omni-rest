import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli.ts",
    "src/adapters/express.ts",
    "src/adapters/nextjs.ts",
    "src/adapters/fastify.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ["@prisma/client", "express", "fastify"],
  treeshake: true,
  outDir: "dist",
});