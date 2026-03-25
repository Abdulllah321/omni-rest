# omni-rest Next.js Example

A complete Next.js application using omni-rest for auto-generated REST APIs with React hooks and components.

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

4. Start the development server:
```bash
npm run dev
```

The app will run on http://localhost:3000

## Features

- ✅ Auto-generated REST API routes
- ✅ React hooks for data fetching (`useMaster`)
- ✅ Drop-in CRUD components (`MasterTable`)
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ Full CRUD operations (Create, Read, Update, Delete)

## API Routes

All API endpoints are automatically available at `/api/[...prismaRest]`:

- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department
- `PATCH /api/departments/:id` - Partially update department
- `DELETE /api/departments/:id` - Delete department

Same for `categories`, `products`, and `cities`.

## Components

### useMaster Hook

```tsx
const { data, loading, error, create, update, remove } = useMaster({
  model: "departments",
  page: 1,
  limit: 20
});
```

### MasterTable Component

```tsx
<MasterTable
  model="departments"
  fields={["name", "description"]}
  title="Department Management"
/>
```

This provides a complete CRUD table with inline editing and creation.

## Demo Pages

- `/` - Home page with overview
- `/masters/departments` - Full CRUD demo for departments