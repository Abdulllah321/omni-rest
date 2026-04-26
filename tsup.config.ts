import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli.ts",
    "src/adapters/express.ts",
    "src/adapters/nextjs.ts",
    "src/adapters/fastify.ts",
    "src/adapters/koa.ts",
    "src/adapters/hapi.ts",
    "src/adapters/nestjs.ts",
    "src/adapters/hono.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "@prisma/client",
    "express",
    "fastify",
    "koa",
    "@koa/router",
    "@hapi/hapi",
    "@nestjs/common",
    "rxjs",
    "hono",
    "swagger-ui-express",
  ],
  treeshake: true,
  outDir: "dist",
});