# omni-rest

> **Auto-generate REST APIs from your Prisma schema** — zero-config CRUD endpoints

[![npm version](https://img.shields.io/npm/v/omni-rest.svg)](https://www.npmjs.com/package/omni-rest)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## What is omni-rest?

omni-rest automatically generates RESTful API endpoints from your Prisma schema. With zero configuration, you get:

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
npm install omni-rest @prisma/client
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
import { expressAdapter } from "omni-rest/express";

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
import { generateOpenApiSpec } from "omni-rest";
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

- **[📚 Documentation Site](https://omni-rest.vercel.app)** - Live documentation website
- **[Quick Start Guide](docs/QUICKSTART.md)** - 5-minute setup
- **[API Reference](docs/API.md)** - Complete endpoint documentation
- **[Configuration](docs/CONFIGURATION.md)** - Guards, hooks, pagination
- **[Contributing](docs/CONTRIBUTING.md)** - How to contribute
- **[Vercel Deployment](docs/VERCEL_DEPLOYMENT.md)** - Deploy docs to Vercel

## Examples

### Express.js

```typescript
import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "omni-rest/express";

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
import { nextjsAdapter } from "omni-rest/nextjs";

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
import { fastifyAdapter } from "omni-rest/fastify";

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

Add authentication before omni-rest routes:

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

### Backend generators

```bash
npx omni-rest generate           # Zod schemas + OpenAPI spec
npx omni-rest generate:zod       # src/schemas.generated.ts only
npx omni-rest generate:openapi   # openapi.json only
```

### Frontend generator

Scaffold a complete React data layer from your Prisma schema — TanStack Query hooks, DataTable components, FormGenerator components, and column definitions — all typed against `@prisma/client`.

```bash
# guided (prompts per model)
npx omni-rest generate:frontend

# autopilot (no prompts, all models, sensible defaults)
npx omni-rest generate:frontend --autopilot
```

Given a `User` model this produces:

```
src/
  hooks/
    useUser.ts          ← useUsers, useUser, useCreateUser, useUpdateUser, useDeleteUser, useBulkDeleteUsers
  components/
    user/
      UserColumns.tsx   ← ColumnDef<User>[] with camelCase → Title Case headers
      UserTable.tsx     ← DataTable wired to hooks, bulk delete, export
      UserForm.tsx      ← FormGenerator with Zod validation + relational dropdowns
    data-table.tsx      ← shared base component (copied once)
    form-generator.tsx  ← shared base component (copied once)
```

Drop the components into a page:

```tsx
import { UserTable } from '@/src/components/user/UserTable'
import { UserForm }  from '@/src/components/user/UserForm'

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <UserForm />
      <UserTable />
    </div>
  )
}
```

**Key flags:**

| Flag | Default | Description |
|---|---|---|
| `--autopilot` | `false` | Skip all prompts |
| `--models <names>` | all | Comma-separated model names |
| `--frontend-dir <path>` | auto-scan | Frontend project root |
| `--out <dir>` | `src/` | Output directory |
| `--no-bulk` | — | Disable bulk delete |
| `--no-optimistic` | — | Disable optimistic updates |
| `--steps auto\|always\|never` | `auto` | Multi-step form control |
| `--stale-time <ms>` | `30000` | TanStack Query staleTime |
| `--gc-time <ms>` | `300000` | TanStack Query gcTime |

See the [Frontend Generator docs](https://omni-rest.vercel.app/docs/generate-frontend) for the full guide.

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
} from "omni-rest";
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

omni-rest supports Prisma 4.0+. For best compatibility, use Prisma 5.0+:

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

MIT © [Omni Rest Contributors](LICENSE)

## Support

- 📖 [Documentation](docs/)
- 🙋 [GitHub Discussions](https://github.com/Abdulllah321/omni-rest/discussions)
- 🐛 [Report Issues](https://github.com/Abdulllah321/omni-rest/issues)
- 💬 [Chat on Discord](https://discord.gg/omni-rest)

## Acknowledgments

Inspired by PostgREST and built for the modern JavaScript/TypeScript ecosystem.

---
@all-contributors please add @mahek395 for code
**Made with ❤️ by the Omni Rest community**
