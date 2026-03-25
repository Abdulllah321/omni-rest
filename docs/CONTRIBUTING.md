# Contributing to prisma-rest

We love contributions! Here's how you can help.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git
- A Prisma project

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/prisma-rest.git
cd prisma-rest

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start watching for changes
npm run dev
```

### Project Structure

```
prisma-rest/
├── src/                    # TypeScript source code
│   ├── adapters/          # Framework adapters (Express, Next.js, Fastify)
│   ├── cli.ts             # Command-line interface
│   ├── index.ts           # Main exports
│   ├── introspect.ts      # Prisma introspection
│   ├── middleware.ts      # Auth/guard middleware
│   ├── openapi.ts         # OpenAPI spec generation
│   ├── query-builder.ts   # Query parsing
│   ├── router.ts          # Core router logic
│   ├── types.ts           # TypeScript definitions
│   ├── validate.ts        # Input validation
│   └── zod-generator.ts   # Zod schema generation
├── test/                  # Test files
├── docs/                  # Documentation
└── examples/              # Example applications
```

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in `src/`

3. Write/update tests in `test/`

4. Build and test:
   ```bash
   npm run build
   npm test
   ```

5. Commit with descriptive messages:
   ```bash
   git commit -m "feat: add bulk update support for all adapters"
   ```

### Code Style

We use TypeScript with strict mode enabled. Follow these conventions:

- Use TypeScript for all code (no `any` unless necessary)
- Use consistent naming: `camelCase` for functions/variables, `PascalCase` for classes/types
- Add JSDoc comments for public functions
- Keep functions focused and under 50 lines when possible
- Use async/await, not callbacks

Example:

```typescript
/**
 * Generate REST endpoints for a Prisma model.
 * @param prisma - The Prisma client instance
 * @param modelName - Name of the model to generate endpoints for
 * @param options - Configuration options
 * @returns Router instance
 */
async function createRouter(
  prisma: any,
  modelName: string,
  options: RouterOptions
): Promise<RouterInstance> {
  // Implementation
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
npm test -- Introspect.test.ts

# Generate coverage report
npm test -- --coverage
```

### Building

```bash
# Build for distribution (ESM, CJS, DTS)
npm run build

# Build with source maps
npm run build -- --sourcemap

# Watch mode development
npm run dev
```

### Testing Your Changes

#### 1. With Express Example

```bash
cd examples/express-app
npm install
npm start
# Test at http://localhost:3000/docs
```

#### 2. With Next.js Example

```bash
cd examples/nextjs-app
npm install
npm run dev
# Test at http://localhost:3000/masters/departments
```

#### 3. With Unit Tests

```bash
npm test
npm run test:watch
```

## Areas for Contribution

### High Priority

- [ ] **Additional Framework Support** - Hapi, Koa, Nest.js adapters
- [ ] **Query Performance** - Optimize large dataset queries
- [ ] **Validation Improvements** - Better error messages and Zod integration
- [ ] **Test Coverage** - Increase test coverage above 80%

### Medium Priority

- [ ] **Caching Layer** - Add optional Redis caching
- [ ] **Rate Limiting** - Built-in rate limiting middleware
- [ ] **GraphQL Export** - Generate GraphQL schema from Prisma
- [ ] **API Versioning** - Support model versioning in API

### Low Priority

- [ ] **CLI Enhancements** - Interactive setup wizard
- [ ] **Documentation** - Add more examples and guides
- [ ] **TypeScript Strict Mode** - Improve type definitions

## Submitting Changes

### Pull Request Process

1. **Update Documentation** - Docs changes in `docs/` and README.md
2. **Add Tests** - New features must have tests
3. **Update Changelog** - Add entry to CHANGELOG.md
4. **Run Full Build** - `npm run build && npm test` must pass
5. **Create PR** - Clear title and description

#### PR Template

```
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #<issue_number>

## Testing
Description of how this was tested

## Checklist
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
```

### Review Criteria

Your PR will be reviewed for:

- ✅ **Code Quality** - Follows style guide, no linting errors
- ✅ **Testing** - Tests cover new functionality
- ✅ **Documentation** - Changes documented
- ✅ **Performance** - No performance regressions
- ✅ **Compatibility** - Supports Node 18+, current Prisma versions

## Reporting Bugs

Use GitHub Issues with this template:

```
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Create schema with...
2. Configure adapter...
3. API call produces...

**Expected behavior**
What should happen

**Environment**
- Node version: 
- Prisma version: 
- OS: 

**Minimal reproduction**
Code or repo demonstrating the issue
```

## Feature Requests

Submit feature requests as GitHub Issues:

```
**Is your feature request related to a problem?**
Description

**Describe the solution**
How should this work?

**Alternative solutions**
Other approaches considered

**Additional context**
Any other information
```

## Release Process

Only maintainers can publish, but here's how releases work:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push: `git push origin v1.0.0`
5. GitHub Actions publishes to npm

## Code of Conduct

Please be respectful and constructive in all interactions.

## Questions?

- GitHub Discussions for questions
- GitHub Issues for bugs/features
- Email: support@example.com

## License

By contributing, you agree your code will be licensed under the MIT License.

---

Thank you for contributing to prisma-rest! 🎉
