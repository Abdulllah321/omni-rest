# API Reference

Complete reference for omni-rest endpoints, parameters, and responses.

> Looking for the frontend generator? See [CLI Tools](./QUICKSTART.md) or the [docs site](https://omni-rest.vercel.app/docs/generate-frontend).

## REST Endpoints

### List (Paginated)

```
GET /api/:model
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `sort` (string) - Sort by field: `field:asc` or `field:desc`
- `include` (string) - Include relations: `relation1,relation2`
- `select` (string) - Select fields: `id,name,email`
- Filter operators: `field_gte`, `field_contains`, etc.

**Response (200):**
```json
{
  "data": [
    { "id": 1, "name": "Engineering" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Create

```
POST /api/:model
```

**Body:** Object with model fields

**Response (201):**
```json
{
  "id": 1,
  "name": "Engineering"
}
```

### Read

```
GET /api/:model/:id
```

**Query Parameters:**
- `include` (string) - Include relations
- `select` (string) - Select fields

**Response (200):**
```json
{
  "id": 1,
  "name": "Engineering",
  "products": [...]
}
```

**Error (404):**
```json
{
  "error": "Department with id \"1\" not found."
}
```

### Update (Full)

```
PUT /api/:model/:id
```

**Body:** Complete object with all fields

**Response (200):**
```json
{
  "id": 1,
  "name": "Engineering Updated"
}
```

### Update (Partial)

```
PATCH /api/:model/:id
```

**Body:** Object with fields to update

**Response (200):**
```json
{
  "id": 1,
  "name": "Engineering Updated"
}
```

### Delete

```
DELETE /api/:model/:id
```

**Response (204):** No content

### Bulk Update

```
PATCH /api/:model/bulk/update
```

**Body:** Array of objects with ID and fields:
```json
[
  { "id": 1, "name": "Engineering" },
  { "id": 2, "name": "Sales" },
  { "id": 3, "name": "HR" }
]
```

**Response (200):**
```json
{
  "updated": 3,
  "records": [
    { "id": 1, "name": "Engineering" },
    { "id": 2, "name": "Sales" },
    { "id": 3, "name": "HR" }
  ]
}
```

### Bulk Delete

```
DELETE /api/:model/bulk/delete
```

**Body:** Array of IDs:
```json
[1, 2, 3]
```

Or array of objects:
```json
[
  { "id": 1 },
  { "id": 2 }
]
```

**Response (200):**
```json
{
  "deleted": 3
}
```

---

## Status Codes

| Code | Meaning | Endpoint |
|------|---------|----------|
| 200 | Success | GET, PUT, PATCH, bulk operations |
| 201 | Created | POST |
| 204 | No Content | DELETE |
| 400 | Bad Request | Invalid data |
| 403 | Forbidden | Guard denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Unique constraint violated |
| 500 | Server Error | Internal error |

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Each record must have an id field"
}
```

### Not Found (404)
```json
{
  "error": "Department with id \"999\" not found."
}
```

### Unique Constraint (409)
```json
{
  "error": "Unique constraint failed on: name"
}
```

### Guard Denied (403)
```json
{
  "error": "Admin only"
}
```

---

## Filter Operators

Use these operators in query parameters:

```
GET /api/product?price_gte=100&name_contains=laptop
```

| Operator | Example | Meaning |
|----------|---------|---------|
| none | `name=John` | Exact match |
| `_gte` | `price_gte=100` | Greater than or equal |
| `_gt` | `price_gt=100` | Greater than |
| `_lte` | `price_lte=500` | Less than or equal |
| `_lt` | `price_lt=500` | Less than |
| `_contains` | `name_contains=pro` | Contains (case-sensitive) |
| `_icontains` | `name_icontains=PRO` | Contains (case-insensitive) |
| `_startsWith` | `email_startsWith=john` | Starts with |
| `_endsWith` | `email_endsWith=@example` | Ends with |
| `_in` | `status_in=active,pending` | In list |
| `_notIn` | `status_notIn=archived` | Not in list |

---

## Query Examples

### Pagination with Total Count
```
GET /api/product?page=2&limit=10
```

Response includes `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`

### Advanced Filtering
```
GET /api/product?price_gte=100&price_lte=500&category_in=electronics,books&sort=name:asc
```

### Include Related Data
```
GET /api/department?include=products
```

Returns:
```json
{
  "id": 1,
  "name": "Engineering",
  "products": [
    { "id": 1, "name": "Product 1" }
  ]
}
```

### Select Specific Fields
```
GET /api/department?select=id,name
```

Returns only selected fields

### Sorting Multiple Fields
```
GET /api/product?sort=category:asc,price:desc
```
