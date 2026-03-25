# omni-rest Documentation

This is the documentation website for omni-rest, built with Next.js and Nextra.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This site is configured for deployment on Vercel with the following settings:

- **Framework Preset:** Next.js
- **Root Directory:** docs-site
- **Build Command:** npm run build
- **Output Directory:** .next

## Project Structure

```
docs-site/
├── pages/
│   ├── index.tsx          # Homepage
│   ├── _app.tsx           # App wrapper
│   └── docs/              # Documentation pages
│       ├── index.mdx      # Introduction
│       ├── getting-started.mdx
│       ├── api-reference.mdx
│       ├── configuration.mdx
│       ├── examples.mdx
│       ├── contributing.mdx
│       └── _meta.json     # Navigation config
├── styles/
│   └── globals.css        # Global styles
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind config
├── postcss.config.js      # PostCSS config
└── package.json
```

## Contributing

To update the documentation:

1. Edit the `.mdx` files in `pages/docs/`
2. Update the navigation in `pages/docs/_meta.json`
3. Test locally with `npm run dev`
4. Commit and push changes

The site will automatically deploy to Vercel when changes are pushed to the main branch.