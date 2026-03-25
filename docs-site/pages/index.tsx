import Head from 'next/head'

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
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Auto-generate REST APIs from your <span className="highlight">Prisma schema</span>
            </h1>
            <p className="hero-subtitle">
              Zero configuration, instant CRUD operations. Works with Express, Next.js, and Fastify.
            </p>
            <div className="hero-actions">
              <a href="/docs/getting-started" className="btn btn-primary">
                Get Started
              </a>
              <a href="https://github.com/Abdulllah321/omni-rest" className="btn btn-secondary">
                View on GitHub
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
app.use("/api", expressAdapter(prisma));

app.listen(3000, () => {
  console.log("🚀 API ready at http://localhost:3000/api");
});`}</code></pre>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Zero Config</h3>
              <p>Just add one line of code and get a full REST API instantly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Type Safe</h3>
              <p>Full TypeScript support with auto-generated types.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>OpenAPI Docs</h3>
              <p>Auto-generated Swagger UI for all your endpoints.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Queries</h3>
              <p>Filter, sort, paginate with standard query parameters.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Security Guards</h3>
              <p>Control access at operation level with authorization.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Bulk Operations</h3>
              <p>Update or delete multiple records in one request.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="frameworks">
        <div className="container">
          <h2 className="section-title">Framework Support</h2>
          <div className="frameworks-grid">
            <div className="framework-card">
              <h3>Express.js</h3>
              <pre><code>{`import { expressAdapter } from "omni-rest/express";
app.use("/api", expressAdapter(prisma));`}</code></pre>
            </div>
            <div className="framework-card">
              <h3>Next.js</h3>
              <pre><code>{`import { nextjsAdapter } from "omni-rest/nextjs";
export const { GET, POST, PUT, PATCH, DELETE } = nextjsAdapter(prisma);`}</code></pre>
            </div>
            <div className="framework-card">
              <h3>Fastify</h3>
              <pre><code>{`import { fastifyAdapter } from "omni-rest/fastify";
fastifyAdapter(app, prisma, { prefix: "/api" });`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 80px 0;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .hero-content {
          text-align: center;
          margin-bottom: 60px;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .highlight {
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary {
          background: white;
          color: #667eea;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.2);
        }
        .hero-code {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 2rem;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9rem;
          overflow-x: auto;
        }
        .features {
          padding: 80px 0;
          background: #f8f9fa;
        }
        .section-title {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 3rem;
          color: #333;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-5px);
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #333;
        }
        .feature-card p {
          color: #666;
          line-height: 1.6;
        }
        .frameworks {
          padding: 80px 0;
        }
        .frameworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .framework-card {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }
        .framework-card h3 {
          margin-bottom: 1rem;
          color: #333;
        }
        .framework-card pre {
          background: #2d3748;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-actions {
            flex-direction: column;
            align-items: center;
          }
          .features-grid, .frameworks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}