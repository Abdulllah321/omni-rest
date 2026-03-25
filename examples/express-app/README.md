# Prisma-REST Express Example

A complete Express.js server using prisma-rest for auto-generated REST APIs with validation and OpenAPI documentation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
npm run db:generate
```

3. Seed the database:
```bash
npm run db:seed
```

4. Start the server:
```bash
npm run dev
```

The server will run on http://localhost:3000

## API Endpoints

All CRUD operations are automatically available:

- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department
- `PATCH /api/departments/:id` - Partially update department
- `DELETE /api/departments/:id` - Delete department

Same for `categories`, `products`, and `cities`.

## Features

- ✅ Auto-generated REST APIs
- ✅ Zod validation on all requests
- ✅ OpenAPI 3.0 documentation at `/docs`
- ✅ Swagger UI for testing
- ✅ TypeScript support
- ✅ Database relationships handled automatically

## Testing the API

Visit http://localhost:3000/docs to see the interactive API documentation and test endpoints.