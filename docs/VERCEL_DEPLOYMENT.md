# Deploying Documentation to Vercel

This guide explains how to deploy the omni-rest documentation website to Vercel.

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- GitHub repository access
- The documentation site built and ready

## Method 1: Deploy from GitHub (Recommended)

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository: `Abdulllah321/omni-rest`
4. Configure the project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `docs-site`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (leave default)
   - **Install Command:** `npm install`

### 2. Environment Variables (Optional)

If your docs site needs environment variables, add them in the Vercel dashboard:

- Go to your project settings
- Navigate to "Environment Variables"
- Add any required variables

### 3. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your site
3. Once deployed, you'll get a URL like: `https://omni-rest.vercel.app`

### 4. Custom Domain (Optional)

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## Method 2: Deploy from CLI

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
cd docs-site
vercel --prod
```

Follow the prompts to configure your project.

## Method 3: Manual Deployment

### 1. Build Locally

```bash
cd docs-site
npm run build
npm run export  # For static export
```

### 2. Deploy to Vercel

```bash
vercel --prod --prebuilt
```

## Configuration Files

The docs site includes these Vercel-specific files:

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "functions": {
    "pages/api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### next.config.js

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/omni-rest' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/omni-rest/' : '',
}

module.exports = nextConfig
```

## Custom Domain Setup

### 1. Add Domain in Vercel

1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Enter your domain (e.g., `docs.omni-rest.com`)
4. Click "Add"

### 2. Configure DNS

Vercel will show you the DNS records to add. For example:

```
Type: CNAME
Name: docs
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates for your domains.

## Preview Deployments

Vercel automatically creates preview deployments for pull requests:

- Every PR gets a unique preview URL
- Format: `https://omni-rest-[branch-name].vercel.app`
- Perfect for reviewing documentation changes

## Environment Variables

For production deployments, you might need:

```bash
# In Vercel dashboard or CLI
vercel env add SITE_URL
vercel env add GITHUB_TOKEN  # For API integrations
```

## Troubleshooting

### Build Fails

**Issue:** `Build failed`
**Solution:**
```bash
cd docs-site
npm install
npm run build
```

Check the build logs in Vercel dashboard.

### 404 Errors

**Issue:** Pages return 404
**Solution:** Check `next.config.js` basePath settings

### Images Not Loading

**Issue:** Images don't load in production
**Solution:** Ensure `images: { unoptimized: true }` in `next.config.js`

### Custom Domain Issues

**Issue:** Custom domain not working
**Solution:**
- Wait for DNS propagation (can take up to 24 hours)
- Check DNS records are correctly set
- Verify domain ownership in Vercel

## Performance Optimization

### 1. Enable Compression

Vercel automatically enables gzip compression.

### 2. Image Optimization

Using `next/image` with `unoptimized: true` for static export.

### 3. Caching

Vercel automatically caches static assets.

## Analytics

To add analytics:

1. Install a service like Vercel Analytics or Google Analytics
2. Add tracking code to `_app.tsx`
3. Configure in Vercel dashboard

## Custom 404 Page

Create `pages/404.tsx`:

```tsx
export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a href="/" className="btn btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}
```

## Maintenance

### Updating Documentation

1. Make changes to `.mdx` files in `docs-site/pages/docs/`
2. Commit and push to GitHub
3. Vercel automatically redeploys

### Monitoring

- Check Vercel dashboard for performance metrics
- Monitor error rates and response times
- Set up alerts for failed deployments

## Support

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Nextra Documentation:** https://nextra.site/docs

---

**Your documentation site will be live at:** `https://omni-rest.vercel.app` 🎉