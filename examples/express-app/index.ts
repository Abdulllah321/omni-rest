import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "prisma-rest/express";
import { generateOpenApiSpec } from "prisma-rest";
import swaggerUi from "swagger-ui-express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// Use prisma-rest express adapter (auto CRUD from Prisma schema)
app.use(
  "/api",
  expressAdapter(prisma, {
    // optional: scope to specific models in your schema
    allow: ["department", "category", "city", "product"],
  })
);

// Expose OpenAPI spec and interactive docs
const openApiSpec = generateOpenApiSpec(prisma, {
  title: "prisma-rest Express example",
  version: "1.0.0",
  basePath: "/api",
  allow: ["department", "category", "city", "product"],
});

app.get("/openapi.json", (_, res) => res.json(openApiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
  console.log("📖 API docs at http://localhost:3000/docs");
  console.log("🌐 OpenAPI JSON at http://localhost:3000/openapi.json");
});