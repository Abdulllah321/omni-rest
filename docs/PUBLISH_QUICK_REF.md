#🚀 Quick Publish Reference Card

**Ready to publish omni-rest to npm?** Use this quick reference.

---

## ⚡ 30-Second Publishing

```bash
# Step 1: Login to npm (one-time)
npm login

# Step 2: Verify everything works
npm test

# Step 3: Publish
npm publish

# Done! ✅
```

---

## ✅ Pre-Publish Checklist

- [ ] npm account exists (https://www.npmjs.com)
- [ ] Logged in: `npm whoami` returns your username
- [ ] Tests pass: `npm test` shows 35/35 passing
- [ ] Build clean: `npm run build` completes with no errors

---

## 📦 What Gets Published

**Package Size:** ~400 KB (source maps included)
**Files:** 35+ compiled files (ESM, CJS, TypeScript, source maps)
**Exports:** 4 main exports (main + 3 framework adapters)

---

## 🔗 After Publishing

Verify with:
```bash
npm info omni-rest
```

View on npm.js:
```
https://www.npmjs.com/package/omni-rest
```

---

## 📚 Documentation Included

✅ README.md - Project overview & examples  
✅ QUICKSTART.md - 5-minute setup  
✅ API.md - Full endpoint reference  
✅ CONFIGURATION.md - Advanced options  
✅ CONTRIBUTING.md - Developer guide  
✅ CHANGELOG.md - Release notes  
✅ LICENSE - MIT license  

---

## ❌ Troubleshooting

| Issue | Fix |
|-------|-----|
| "Not logged in" | Run: `npm login` |
| "Tests failing" | Run: `npm test` to see errors |
| "Build failed" | Run: `npm run build` to debug |
| "Package unavailable" | Wait 5 min, then check npm.js |

---

## 🎯 Default Package Info

```
Name: omni-rest
Version: 0.1.0
License: MIT
Repository: github.com/Abdulllah321/omni-rest
Homepage: github.com/Abdulllah321/omni-rest#readme
```

---

## 🔄 Future Updates

For next release:
```bash
npm version minor  # Bumps version
npm publish
```

Or manually:
```bash
# Edit version in package.json
npm publish
```

---

**Questions?** See [`docs/NPM_PUBLISHING_GUIDE.md`](NPM_PUBLISHING_GUIDE.md)
