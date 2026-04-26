# Quick Start Guide

Get omni-rest up and running in 5 minutes.

## 1. Installation

```bash
npm install omni-rest @prisma/client prisma -D
```

## 2. Initialize Prisma (if needed)

```bash
npx prisma init
```

Create or update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Department {
  id        Int     @id @default(autoincrement())
  name      String  @unique
  products  Product[]
}

model Product {
  id            Int     @id @default(autoincrement())
  name          String
  price         Float
  departmentId  Int
  department    Department @relation(fields: [departmentId], references: [id])
  @@index([departmentId])
}
```

Generate and sync your schema:

```bash
npx prisma generate
npx prisma db push
```

## 3. Set Up Express API

Create `src/index.ts`:

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "omni-rest/express";
import { generateOpenApiSpec } from "omni-rest";
import swaggerUi from "swagger-ui-express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Mount auto-generated API
app.use(
  "/api",
  expressAdapter(prisma, {
    allow: ["department", "product"],
  })
);

// API Documentation
const spec = generateOpenApiSpec(prisma, {
  title: "My API",
  version: "1.0.0",
  basePath: "/api",
});
app.get("/openapi.json", (_, res) => res.json(spec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

app.listen(3000, () => {
  console.log("🚀 Server running");
  console.log("📖 Docs at http://localhost:3000/docs");
});
```

## 4. Run and Test

```bash
npm run dev
```

Visit `http://localhost:3000/docs` in your browser.

### Test Endpoints

```bash
# Create
curl -X POST http://localhost:3000/api/department \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering"}'

# List
curl http://localhost:3000/api/department

# Get by ID
curl http://localhost:3000/api/department/1

# Update
curl -X PATCH http://localhost:3000/api/department/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Sales"}'

# Delete
curl -X DELETE http://localhost:3000/api/department/1

# Bulk update
curl -X PATCH http://localhost:3000/api/department/bulk/update \
  -H "Content-Type: application/json" \
  -d '[{"id":1,"name":"Engineering"},{"id":2,"name":"Sales"}]'

# Bulk delete
curl -X DELETE http://localhost:3000/api/department/bulk/delete \
  -H "Content-Type: application/json" \
  -d '[1,2,3]'
```

## 5. Advanced Features

### Add Authorization Guards

```typescript
expressAdapter(prisma, {
  guards: {
    department: {
      DELETE: async ({ id }) => {
        if (!isAdmin) return "Admin only";
      },
    },
  },
  beforeOperation: async ({ model, method }) => {
    console.log(`${method} ${model}`);
  },
});
```

### Query with Filters

```bash
# Pagination
http://localhost:3000/api/product?page=2&limit=20

# Filter
http://localhost:3000/api/product?price_gte=100&price_lte=500

# Sort
http://localhost:3000/api/product?sort=name:asc,price:desc

# Relations
http://localhost:3000/api/department?include=products

# Select fields
http://localhost:3000/api/department?select=id,name
```

## Next Steps

- Read [API Reference](./API.md)
- Check [Examples](../examples)
- Learn about [Configuration](./CONFIGURATION.md)
- **Scaffold a frontend**: `npx omni-rest generate:frontend --autopilot`
- **Install the AI skill pack**: `npx omni-rest install:skills`
- Read [AI Skills Pack](./AI_SKILLS.md)
