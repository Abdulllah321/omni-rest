import Head from 'next/head'
import Link from 'next/link'
import { Zap, ShieldCheck, FileText, Search, Lock, RefreshCw, Layers, Terminal } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Head>
        <title>Omni Rest - Auto-generate REST APIs from Prisma</title>
        <meta name="description" content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints" />
        <meta name="og:title" content="Omni Rest" />
        <meta name="og:description" content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints" />
        <meta name="og:image" content="https://omnirest.dev/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Omni Rest" />
        <meta name="twitter:description" content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints" />
        <meta name="twitter:image" content="https://omnirest.dev/og-image.png" />
      </Head>

      <div className="hero">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div className="hero-content" style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 className="hero-title">
              Auto-generate REST APIs from your <span className="highlight">Prisma schema</span>
            </h1>
            <p className="hero-subtitle">
              Zero configuration, instant CRUD endpoints. Seamlessly integrates with Express, Next.js, and Fastify in a beautiful, type-safe package.
            </p>
            <div className="hero-actions">
              <Link href="/docs/getting-started" className="btn btn-primary">
                Get Started
                <Zap size={18} />
              </Link>
              <a href="https://github.com/Abdulllah321/omni-rest" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
                View on GitHub
                <Terminal size={18} />
              </a>
            </div>
          </div>

          <div className="hero-code">
            <pre><code>{`import express from "express";
import { PrismaClient } from "@prisma/client";
import { expressAdapter } from "omni-rest/express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
// 🚀 One line to generate all CRUD endpoints
app.use("/api", expressAdapter(prisma));

app.listen(3000, () => {
  console.log("Ready at http://localhost:3000/api");
});`}</code></pre>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 className="section-title">Why Omni Rest?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Zap size={28} />
              </div>
              <h3>Zero Configuration</h3>
              <p>Just add one line of code and automatically get a full REST API for all your Prisma models, instantly saving you hours of boilerplate work.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={28} />
              </div>
              <h3>End-to-end Type Safety</h3>
              <p>Full TypeScript support out of the box. Enjoy pristine auto-generated types that ensure your frontend and backend stay perfectly in sync.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileText size={28} />
              </div>
              <h3>OpenAPI Documentation</h3>
              <p>Stop writing documentation manually. Get an auto-generated Swagger UI covering every endpoint, query parameter, and payload schema.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Search size={28} />
              </div>
              <h3>Advanced Data Querying</h3>
              <p>Built-in support for complex filtering, nested sorting, and cursor-based or offset pagination via standard query parameters.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Lock size={28} />
              </div>
              <h3>Robust Security Guards</h3>
              <p>Implement fine-grained access control at the operation level. Easily secure endpoints, fields, and specific models with granular authorization.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <RefreshCw size={28} />
              </div>
              <h3>Bulk Operations</h3>
              <p>Perform performant batch updates or deletes in a single request. Optimize your network calls and dramatically improve application responsiveness.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="frameworks">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <h2 className="section-title">Seamless Framework Support</h2>
          <div className="frameworks-grid">
            <div className="framework-card">
              <h3><Layers size={22} className="mr-2 inline" /> Express.js</h3>
              <pre><code>{`import { expressAdapter } from "omni-rest/express";

app.use("/api", expressAdapter(prisma));`}</code></pre>
            </div>
            <div className="framework-card">
              <h3><Layers size={22} className="mr-2 inline"/> Next.js App Router</h3>
              <pre><code>{`import { nextjsAdapter } from "omni-rest/nextjs";

export const { 
  GET, POST, PUT, PATCH, DELETE 
} = nextjsAdapter(prisma);`}</code></pre>
            </div>
            <div className="framework-card">
              <h3><Layers size={22} className="mr-2 inline"/> Fastify</h3>
              <pre><code>{`import { fastifyAdapter } from "omni-rest/fastify";

fastifyAdapter(app, prisma, { 
  prefix: "/api" 
});`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}