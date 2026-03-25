# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-01-15

### Added
- **Bulk Operations** - Added `PATCH /api/:model/bulk/update` and `DELETE /api/:model/bulk/delete` endpoints
- **Bulk Update** - Update multiple records in a single request with array of updates
- **Bulk Delete** - Delete multiple records by ID array
- **OpenAPI Documentation** - Added bulk operation endpoint documentation to OpenAPI specs
- **Configuration Guide** - Comprehensive docs for guards, hooks, and pagination settings
- **Contributing Guide** - Guidelines for contributors including development setup
- **QUICKSTART Guide** - 5-minute getting started guide

### Changed
- **DMMF Introspection** - Updated to work with Prisma v5 `_runtimeDataModel` property
- **Router Signature** - Added `operation?: string` parameter to support bulk operations
- **Express Adapter** - Enhanced to handle bulk operation routes efficiently

### Fixed
- Fixed DMMF model introspection for Prisma v5 compatibility
- Fixed TypeScript type definitions for extended router signature

### Improved
- Better error messages for validation failures
- Enhanced OpenAPI spec generation with request/response examples
- Improved documentation structure with separate guides

## [0.1.0] - 2024-01-10

### Added
- Initial release of prisma-rest
- **Auto-generated CRUD APIs** - Automatically generate REST endpoints from Prisma schema
- **Multiple Framework Support** - Express.js, Next.js App Router, and Fastify adapters
- **Advanced Queries** - Filtering, sorting, and pagination with query parameters
- **Authorization Guards** - Control access per model and operation
- **Audit Hooks** - Before/after operation hooks for logging and side effects
- **OpenAPI Documentation** - Auto-generated Swagger UI endpoint documentation
- **Type Safety** - Full TypeScript support with generated types
- **CLI Tools** - Command-line utilities for schema introspection and validation
- **Query Builder** - Sophisticated query parameter parsing for complex filters
- **Comprehensive Examples** - Express and Next.js example applications with Prisma
- **MIT License** - Open source with permissive licensing

### Features
- 8 endpoints per model: LIST, CREATE, READ, UPDATE, PATCH, DELETE, BULK_UPDATE, BULK_DELETE
- Filter operators: eq, ne, lt, lte, gt, gte, in, nin, contains, startsWith, endsWith
- Pagination with limit and offset
- Model allow-listing for security
- Request/response validation with Zod
- Built-in Swagger UI for API exploration

---

## Unreleased

### Planned
- GraphQL schema export
- Real-time subscriptions via WebSocket
- Webhook event system
- Rate limiting middleware
- Additional framework support (Koa, Nest.js, Hapi)
- Built-in caching layer (Redis support)
- API versioning system
- Database migration helpers
- Role-based access control (RBAC)
