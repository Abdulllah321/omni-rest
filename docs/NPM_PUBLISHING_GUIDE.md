# NPM Publishing Guide

This document provides a complete checklist and guide for publishing prisma-rest to npm.

## Pre-Publishing Checklist

### ✅ Code Quality
- [x] All TypeScript code compiles without errors
- [x] All tests pass (35/35 tests passing)
- [x] All adapters (Express, Next.js, Fastify) working correctly
- [x] Bulk operations implemented and tested
- [x] Build process complete (ESM, CJS, DTS all generated)

### ✅ Documentation
- [x] README.md - Comprehensive project overview
- [x] QUICKSTART.md - 5-minute getting started guide
- [x] API.md - Complete REST endpoint reference
- [x] CONFIGURATION.md - Advanced configuration and options
- [x] CONTRIBUTING.md - Contribution guidelines
- [x] CHANGELOG.md - Version history and release notes
- [x] LICENSE - MIT license file

### ✅ Package Configuration
- [x] package.json - Updated with metadata
  - [x] Author name and URL
  - [x] Repository URL (GitHub)
  - [x] Homepage URL
  - [x] Bugs URL
  - [x] Keywords
  - [x] Proper export paths (., ./express, ./nextjs, ./fastify)
- [x] .npmignore - Excludes source and config files from npm package
- [x] tsconfig.json - Configured for TypeScript compilation
- [x] tsup.config.ts - Build configuration present

### ✅ Version Control  
- [x] CHANGELOG.md up-to-date
- [x] All code changes committed (implied ready for release)

## Publishing Steps

### Step 1: Create NPM Account (One-time)
If you don't have an npm account:
```bash
npm adduser
# Or sign up at https://www.npmjs.com/signup
```

### Step 2: Log In to NPM
```bash
npm login
```

Then enter your npm credentials:
- Username: your-npm-username
- Password: your-npm-password
- Email: your-email@example.com

### Step 3: Verify NPM Login
```bash
npm whoami
```

Expected output: Your npm username

### Step 4: Verify Package Name Availability
```bash
npm search prisma-rest
```

Or check at: https://www.npmjs.com/package/prisma-rest

### Step 5: Run Pre-publish Checks
```bash
npm run clean
npm run build
npm test
```

All should pass with:
- ✅ Build success for ESM, CJS, and DTS
- ✅ All 35 tests passing
- ✅ dist/ folder generated with all files

### Step 6: Update Version (Optional)
If you want to bump the version:
```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0
```

Or manually edit `package.json` and commit.

### Step 7: Publish to NPM
```bash
npm publish
```

Or with pre-publish checks:
```bash
npm run prepublishOnly
npm publish
```

### Step 8: Verify Published Package
After a few moments, verify the package is live:

```bash
# Check npm registry
npm info prisma-rest

# Or visit: https://www.npmjs.com/package/prisma-rest
```

### Step 9: Create Git Tag (Recommended)
```bash
git tag v0.1.0
git push origin v0.1.0
```

## What Will Be Published

The npm package includes:

```
prisma-rest/
├── dist/
│   ├── index.js / index.mjs / index.d.ts
│   ├── cli.js / cli.mjs
│   └── adapters/
│       ├── express.js / express.mjs / express.d.ts
│       ├── nextjs.js / nextjs.mjs / nextjs.d.ts
│       └── fastify.js / fastify.mjs / fastify.d.ts
├── README.md
├── LICENSE
├── CHANGELOG.md
└── package.json
```

**Excluded from npm** (via .npmignore):
- src/ (source TypeScript files)
- test/ (test files)
- examples/ (example apps)
- Configuration files
- .git, .github, .vscode
- Build artifacts

## Package Information

**Name:** `prisma-rest`  
**Version:** 0.1.0  
**License:** MIT  
**Repository:** https://github.com/prisma-rest/prisma-rest  
**Homepage:** https://github.com/prisma-rest/prisma-rest#readme  
**Keywords:** prisma, rest, api, crud, express, nextjs, fastify

## Installation After Publishing

Users will be able to install with:

```bash
npm install prisma-rest
```

And import from:
```typescript
import { expressAdapter } from "prisma-rest/express";
import { nextjsAdapter } from "prisma-rest/nextjs";
import { fastifyAdapter } from "prisma-rest/fastify";
```

## Troubleshooting

### "You must be logged in to publish"
```bash
npm login
npm whoami  # Verify login
```

### "This package name cannot be published"
- Check if package name is already taken: `npm search prisma-rest`
- Try a different name or contact npm support if it's inactive

### "The server rejected the request"
- Verify your email is confirmed on npmjs.com
- Check your npm account settings
- Ensure you have proper permissions

### "dist/ folder missing"
```bash
npm run build
# Then npm publish
```

### Success but package not visible
- npm can take a few moments to update
- Check: `npm info prisma-rest`
- Visit: https://www.npmjs.com/package/prisma-rest

## After Publishing

### Create GitHub Release
1. Go to https://github.com/prisma-rest/prisma-rest/releases
2. Click "Create new release"
3. Select tag `v0.1.0`
4. Add release notes from CHANGELOG.md
5. Publish release

### Announce the Release
- Share on Twitter
- Post in relevant Discord/forums
- Add to discussion threads

### Monitor for Issues
- Watch for GitHub issues
- Monitor npm download stats
- Respond to user questions

## Future Publishing

For subsequent releases:

```bash
# Make changes and test
npm test
npm run build

# Bump version
npm version minor  # or patch/major

# Publish
npm publish

# Create git tag
git push origin v0.2.0
```

Or use the npm scripts in package.json:
```bash
npm run release:patch   # 0.1.0 → 0.1.1
npm run release:minor   # 0.1.0 → 0.2.0
npm run release:major   # 0.1.0 → 1.0.0
```

## References

- [npm Docs - Publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [npm Docs - package.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [npm Docs - .npmignore](https://docs.npmjs.com/cli/v10/using-npm/npmignore)
- [Semantic Versioning](https://semver.org/)

---

## Quick Start (TL;DR)

```bash
# 1. Login to npm
npm login

# 2. Verify everything
npm run clean && npm run build && npm test

# 3. Publish
npm publish

# 4. Verify
npm info prisma-rest
```

That's it! Your package is now published on npm! 🎉
