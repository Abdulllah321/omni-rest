# Configuration Guide

Learn how to configure omni-rest for your specific needs.

## Basic Configuration

### Model Restriction

Only expose specific models:

```typescript
import { expressAdapter } from "omni-rest/express";

expressAdapter(prisma, {
  allow: ["department", "product"],  // Only these models are exposed
});
```

### Authorization Guards

Control access to operations per model:

```typescript
expressAdapter(prisma, {
  guards: {
    department: {
      POST: async ({ id, body }) => {
        if (!isAdmin()) {
          return "Only admins can create departments";
        }
      },
      DELETE: async ({ id, body }) => {
        if (!isAdmin()) {
          return "Only admins can delete departments";
        }
      },
      PATCH: async ({ id, body }) => {
        if (!isModerator()) {
          return "Only moderators can update";
        }
      },
    },
    product: {
      DELETE: async ({ id, body }) => {
        // Prevent deleting products with inventory
        const product = await prisma.product.findUnique({ where: { id } });
        if (product?.inventory > 0) {
          return "Cannot delete products with active inventory";
        }
      },
    },
  },
});
```

Guard Context:
- `id` - Record ID (for single operations)
- `body` - Request body data

**Return Value:**
- Return error message string to deny access
- Return `undefined` or `null` to allow

### Lifecycle Hooks

Run code before/after operations:

```typescript
expressAdapter(prisma, {
  beforeOperation: async ({ model, method, id, body }) => {
    // Log all operations
    console.log(`${method} ${model}${id ? `/${id}` : ""}`);
    
    // Add audit trail
    await auditLog.create({
      model,
      method,
      timestamp: new Date(),
    });
  },

  afterOperation: async ({ model, method, id, body, result }) => {
    // Send webhooks
    if (method === "POST") {
      await webhook.trigger("record.created", {
        model,
        data: result,
      });
    }
    
    // Update cache
    cache.invalidate(model);
  },
});
```

Hook Context:
- `model` - Model name
- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `id` - Record ID (for single operations)
- `body` - Request body
- `result` - Operation result (afterOperation only)

### Pagination Defaults

Control pagination behavior:

```typescript
expressAdapter(prisma, {
  defaultLimit: 20,  // Default items per page
  maxLimit: 100,     // Maximum items per page
});
```

Users can override with query parameters:
```
GET /api/product?limit=50  // OK (< maxLimit)
GET /api/product?limit=200 // Capped at maxLimit (100)
```

---

## OpenAPI Configuration

Generate customized API documentation:

```typescript
import { generateOpenApiSpec } from "omni-rest";

const spec = generateOpenApiSpec(prisma, {
  title: "My Company API",
  version: "1.0.0",
  basePath: "/api",
  allow: ["department", "product"],  // Only document these models
  servers: [
    {
      url: "https://api.example.com",
      description: "Production",
    },
    {
      url: "https://staging-api.example.com",
      description: "Staging",
    },
  ],
});
```

Serve with Swagger UI:

```typescript
import swaggerUi from "swagger-ui-express";

app.get("/openapi.json", (_, res) => res.json(spec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
  },
}));
```

---

## Full Configuration Example

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "omni-rest/express";
import { generateOpenApiSpec } from "omni-rest";
import swaggerUi from "swagger-ui-express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ── API Configuration ──
const apiConfig = {
  // Model access control
  allow: ["department", "product", "category"],

  // Authorization
  guards: {
    product: {
      DELETE: async ({ id }) => {
        const hasOrders = await prisma.order.count({
          where: { items: { some: { productId: id } } },
        });
        if (hasOrders > 0) {
          return "Cannot delete products with active orders";
        }
      },
    },
    department: {
      POST: async () => !isAdmin() ? "Admin only" : undefined,
      DELETE: async () => !isAdmin() ? "Admin only" : undefined,
    },
  },

  // Logging & Auditing
  beforeOperation: async ({ model, method, id, body }) => {
    logger.info(`API ${method} ${model}${id ? `/${id}` : ""}`, {
      userId: currentUser.id,
      body,
      timestamp: new Date(),
    });
  },

  afterOperation: async ({ model, method, result }) => {
    if (method === "POST" || method === "PATCH") {
      await analytics.track("api.change", {
        model,
        method,
        recordId: result.id,
      });
    }
  },

  // Pagination
  defaultLimit: 25,
  maxLimit: 200,
};

// ── Mount API ──
app.use("/api", expressAdapter(prisma, apiConfig));

// ── API Documentation ──
const spec = generateOpenApiSpec(prisma, {
  title: "My Company REST API",
  version: "1.0.0",
  basePath: "/api",
  allow: apiConfig.allow,
  servers: [
    { url: "https://api.example.com", description: "Production" },
    { url: "http://localhost:3000", description: "Development" },
  ],
});

app.get("/openapi.json", (_, res) => res.json(spec));
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(spec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// ── Server ──
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
  console.log("📖 Docs at http://localhost:3000/docs");
  console.log("🔗 API at http://localhost:3000/api");
});
```

---

## Per-Adapter Configuration

### Express

```typescript
import { expressAdapter } from "omni-rest/express";

app.use("/api", expressAdapter(prisma, options));
```

### Next.js

```typescript
// app/api/[...prismaRest]/route.ts
import { nextjsAdapter } from "omni-rest/nextjs";

export const { GET, POST, PUT, PATCH, DELETE } = nextjsAdapter(prisma, options);
```

### Fastify

```typescript
import { fastifyAdapter } from "omni-rest/fastify";

fastifyAdapter(app, prisma, {
  ...options,
  prefix: "/api",  // Custom prefix
});
```

---

## Environment-Specific Configuration

```typescript
const isProduction = process.env.NODE_ENV === "production";

const config = {
  defaultLimit: isProduction ? 20 : 100,
  maxLimit: isProduction ? 100 : 1000,
  guards: isProduction ? productionGuards : {},
  beforeOperation: isProduction ? auditHook : undefined,
};

expressAdapter(prisma, config);
```

---

## Best Practices

1. **Always add guards for writes** - Control who can create/delete
2. **Log all operations** - Use hooks for audit trails
3. **Set reasonable limits** - Prevent abuse with `maxLimit`
4. **Document your API** - Generate OpenAPI specs for clients
5. **Enable TypeScript** - Get full type safety
