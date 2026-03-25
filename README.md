# prisma-rest

> **Auto-generate REST APIs from your Prisma schema** — zero-config CRUD endpoints

[![npm version](https://img.shields.io/npm/v/prisma-rest.svg)](https://www.npmjs.com/package/prisma-rest)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## What is prisma-rest?

prisma-rest automatically generates RESTful API endpoints from your Prisma schema. With zero configuration, you get:

✅ **CRUD Operations** - Create, Read, Update, Delete any model  
✅ **Bulk Operations** - Update/delete multiple records in one request  
✅ **Advanced Queries** - Filter, sort, paginate with standard query parameters  
✅ **OpenAPI Docs** - Auto-generated Swagger UI for all endpoints  
✅ **Type Safety** - Full TypeScript support with generated types  
✅ **Framework Agnostic** - Works with Express, Next.js, Fastify, and more  
✅ **Security Guards** - Control access at operation level  
✅ **Audit Hooks** - Log operations and trigger side effects  

## Quick Start

### Installation

```bash
npm install prisma-rest @prisma/client
npm install -D prisma
```

### Basic Setup

Define your schema:

```prisma
// prisma/schema.prisma
model Product {
  id    Int     @id @default(autoincrement())
  name  String  @unique
  price Float
  inventory Int  @default(0)
}
```

Mount the API:

```typescript
// server.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "prisma-rest/express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/api", expressAdapter(prisma));

app.listen(3000);
```

Start making requests:

```bash
# GET all products
curl http://localhost:3000/api/product

# Create product
curl -X POST http://localhost:3000/api/product \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Laptop","price":999.99}'

# Get product by ID
curl http://localhost:3000/api/product/1

# Update product
curl -X PATCH http://localhost:3000/api/product/1 \\
  -H "Content-Type: application/json" \\
  -d '{"price":899.99}'

# Delete product
curl -X DELETE http://localhost:3000/api/product/1
```

## Features

### Framework Support

| Framework | Status | Example |
|-----------|--------|---------|
| **Express** | ✅ | [examples/express-app](examples/express-app) |
| **Next.js App Router** | ✅ | [examples/nextjs-app](examples/nextjs-app) |
| **Fastify** | ✅ | [Source](src/adapters/fastify.ts) |
| **Koa** | 🔵 | Planned |
| **Nest.js** | 🔵 | Planned |

### API Endpoints

Each model automatically gets 8 REST endpoints:

```
LIST      GET    /api/:model?limit=10&offset=0&filter=...
CREATE    POST   /api/:model
READ      GET    /api/:model/:id
UPDATE    PUT    /api/:model/:id
PATCH     PATCH  /api/:model/:id
DELETE    DELETE /api/:model/:id
BULK_UPD  PATCH  /api/:model/bulk/update
BULK_DEL  DELETE /api/:model/bulk/delete
```

### Query Parameters

The LIST endpoint supports powerful filtering and pagination:

```javascript
// Pagination
GET /api/product?limit=10&offset=20

// Sorting
GET /api/product?orderBy=price:desc&orderBy=name:asc

// Filtering
GET /api/product?name=Laptop&price[gte]=100&price[lte]=1000&inventory[gt]=0

// Filter Operators
// eq, ne, lt, lte, gt, gte, in, nin, contains, startsWith, endsWith
```

Full API Reference: [docs/API.md](docs/API.md)

### Security Features

#### Authorization Guards

Control access per model and operation:

```typescript
expressAdapter(prisma, {
  guards: {
    product: {
      DELETE: async ({ id }) => {
        const hasOrders = await prisma.order.count({
          where: { items: { some: { productId: id } } },
        });
        if (hasOrders > 0) {
          return "Cannot delete products with orders";
        }
      },
    },
  },
});
```

#### Audit Logging

Track all operations with hooks:

```typescript
expressAdapter(prisma, {
  beforeOperation: async ({ model, method, id, body }) => {
    await auditLog.create({
      model, method, userId: req.user.id,
      timestamp: new Date(),
    });
  },
});
```

Configuration Guide: [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

### OpenAPI Documentation

Automatically generate Swagger UI:

```typescript
import { generateOpenApiSpec } from "prisma-rest";
import swaggerUi from "swagger-ui-express";

const spec = generateOpenApiSpec(prisma, {
  title: "My API",
  version: "1.0.0",
  basePath: "/api",
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));
```

Visit http://localhost:3000/docs to explore your API!

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - 5-minute setup
- **[API Reference](docs/API.md)** - Complete endpoint documentation
- **[Configuration](docs/CONFIGURATION.md)** - Guards, hooks, pagination
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute

## Examples

### Express.js

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "prisma-rest/express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use("/api", expressAdapter(prisma, {
  allow: ["product", "category"],  // Only expose these models
  
  guards: {
    product: {
      DELETE: async ({ id }) => {
        const count = await prisma.order.count({
          where: { items: { some: { productId: id } } },
        });
        if (count > 0) return "Has active orders";
      },
    },
  },

  beforeOperation: async ({ model, method }) => {
    console.log(\ \);
  },
}));

app.listen(3000, () => console.log("🚀 Ready on :3000"));
```

Full Express Example: [examples/express-app](examples/express-app)

### Next.js App Router

```typescript
// app/api/[...prismaRest]/route.ts
import { PrismaClient } from "@prisma/client";
import { nextjsAdapter } from "prisma-rest/nextjs";

const prisma = new PrismaClient();

export const { GET, POST, PUT, PATCH, DELETE } = nextjsAdapter(prisma, {
  allow: ["product"],
});
```

Full Next.js Example: [examples/nextjs-app](examples/nextjs-app)

### Fastify

```typescript
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { fastifyAdapter } from "prisma-rest/fastify";

const app = Fastify();
const prisma = new PrismaClient();

fastifyAdapter(app, prisma, {
  prefix: "/api",
  allow: ["product"],
});

app.listen({ port: 3000 });
```

## Advanced Usage

### Custom Middleware

Add authentication before prisma-rest routes:

```typescript
app.use("/api", authenticate, expressAdapter(prisma));

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  req.user = verifyToken(token);
  next();
}
```

### Model Filtering

Only expose certain models:

```typescript
expressAdapter(prisma, {
  allow: ["product", "category"],  // Only these
});
```

### Pagination Limits

Control default and maximum pagination:

```typescript
expressAdapter(prisma, {
  defaultLimit: 20,   // Default page size
  maxLimit: 100,      // Maximum allowed
});
```

### Lifecycle Hooks

Run code before/after operations:

```typescript
expressAdapter(prisma, {
  beforeOperation: async ({ model, method, id, body }) => {
    // Log, validate, audit trail
  },

  afterOperation: async ({ model, method, result }) => {
    // Webhook, cache invalidation, events
  },
});
```

Full Configuration: [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

## CLI

prisma-rest includes a CLI for schema introspection:

```bash
# Introspect your Prisma schema
npx prisma-rest introspect

# Generate all endpoints
npx prisma-rest generate

# Validate configuration
npx prisma-rest validate
```

## How It Works

1. **Schema Introspection** - Reads your Prisma schema using Prisma._runtimeDataModel
2. **Route Generation** - Creates REST routes based on your models and fields
3. **Query Building** - Parses URL parameters to build Prisma queries
4. **Execute** - Runs queries through your PrismaClient instance
5. **Response Formatting** - Returns standardized JSON responses

## Type Safety

Full TypeScript support with automatically generated types:

```typescript
import type {
  RouterInstance,
  PrismaRestOptions,
  HandlerResult,
} from "prisma-rest";
```

## Performance Considerations

- **Pagination defaults** - Set reasonable defaults with defaultLimit and maxLimit
- **Database indexes** - Create indexes on frequently filtered fields
- **Query optimization** - Use select and include in hooks to limit data
- **Caching** - Implement caching with afterOperation hooks

## Security Best Practices

✅ **Always use guards** for sensitive operations (DELETE, POST)  
✅ **Validate user permissions** in guards before allowing operations  
✅ **Enable audit logging** with beforeOperation/afterOperation hooks  
✅ **Use allow list** to expose only necessary models  
✅ **Implement authentication** middleware before mounting adapter  
✅ **Set reasonable pagination limits** to prevent abuse  

Example secure setup:

```typescript
expressAdapter(prisma, {
  allow: ["product"],  // Only expose needed models
  
  guards: {
    product: {
      POST: async () => !isAdmin() ? "Admin only" : undefined,
      DELETE: async () => !isAdmin() ? "Admin only" : undefined,
    },
  },
  
  beforeOperation: async ({ model, method, user }) => {
    logAuditTrail({ model, method, userId: user.id });
  },
});
```

## Troubleshooting

### "Cannot find module" errors

Ensure all dependencies are installed:

```bash
npm install @prisma/client express swagger-ui-express
```

### CORS Issues

Add CORS middleware before mounting adapter:

```typescript
import cors from "cors";
app.use(cors());
app.use("/api", expressAdapter(prisma));
```

### TypeScript Errors

Ensure you have proper types installed:

```bash
npm install -D @types/express @types/node typescript
```

### Prisma Version Compatibility

prisma-rest supports Prisma 4.0+. For best compatibility, use Prisma 5.0+:

```bash
npm install @prisma/client@^5.0.0
```

## Contributing

Found a bug? Have a feature idea? Contributions welcome!

[Contributing Guide](docs/CONTRIBUTING.md)

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run build        # Build distribution
```

## Roadmap

- [ ] GraphQL schema export
- [ ] Real-time subscriptions
- [ ] Webhook system
- [ ] Rate limiting middleware
- [ ] Additional framework support (Koa, Nest.js)
- [ ] Caching layer
- [ ] API versioning

## License

MIT © [Prisma REST Contributors](LICENSE)

## Support

- 📖 [Documentation](docs/)
- 🙋 [GitHub Discussions](https://github.com/prisma-rest/prisma-rest/discussions)
- 🐛 [Report Issues](https://github.com/prisma-rest/prisma-rest/issues)
- 💬 [Chat on Discord](https://discord.gg/prisma-rest)

## Acknowledgments

Inspired by PostgREST and built for the modern JavaScript/TypeScript ecosystem.

---

**Made with ❤️ by the Prisma REST community**
