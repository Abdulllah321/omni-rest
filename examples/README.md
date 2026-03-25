# Prisma-REST Examples

Complete, runnable examples showing how to use prisma-rest in real applications.

## Examples

### Express.js Example

A traditional Express server with:
- Auto-generated REST APIs
- Zod validation
- OpenAPI/Swagger documentation
- SQLite database

```bash
cd examples/express-app
npm install
npm run db:push
npm run db:seed
npm run dev
```

Visit http://localhost:3000/docs for API documentation.

### Next.js Example

A modern Next.js app with:
- App Router
- React hooks for data fetching
- Drop-in CRUD components
- TypeScript + Tailwind CSS

```bash
cd examples/nextjs-app
npm install
npm run db:push
npm run db:seed
npm run dev
```

Visit http://localhost:3000 for the demo app.

## Common Setup Steps

For both examples:

1. **Install dependencies**: `npm install`
2. **Set up database**: `npm run db:push` (creates tables)
3. **Generate Prisma client**: `npm run db:generate`
4. **Seed data**: `npm run db:seed` (optional)
5. **Start development**: `npm run dev`

## Database

Both examples use SQLite for simplicity. The schema includes:
- Departments
- Categories (belongs to Department)
- Products (belongs to Category)
- Cities

## API Features

- Full CRUD operations
- Pagination, sorting, filtering
- Relationship handling
- Input validation
- TypeScript types
- OpenAPI documentation (Express example)

## Testing Your Package

To test prisma-rest locally:

```bash
# In the root directory
npm run build
npm link

# In an example directory
npm link prisma-rest
```

This lets you test changes to the main package in the examples.