import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  ShieldCheck,
  Lock,
  Terminal,
  ArrowRight,
  Database,
  Cpu,
} from "lucide-react";
import { Icon } from "@iconify/react";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Head>
        <title>Omni Rest | Auto-generate REST APIs from Prisma</title>
        <meta
          name="description"
          content="Turn your Prisma schema into a production-ready REST API in seconds. Zero configuration, type-safe, and framework-agnostic."
        />
        <meta
          name="favicon"
          content="/logo-removebg.png"
        />
        <meta property="og:title" content="Omni Rest" />
        <meta
          property="og:description"
          content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints"
        />
        <meta property="og:image" content="/og-image.png" />
      </Head>

      <div className="bg-mesh" />
      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="glass-pill">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Now supporting Next.js 14 &amp; Fastify
                </div>
                <h1 className="hero-title">
                  Turn your <span className="text-gradient">Prisma Schema</span>{" "}
                  into a Production API
                </h1>
                <p className="hero-subtitle">
                  Stop writing boilerplate CRUD. Omni Rest auto-generates
                  type-safe REST endpoints from your Prisma models in a single
                  line of code.
                </p>
                <div className="hero-actions">
                  <Link
                    href="/docs/getting-started"
                    className="btn-premium btn-premium-primary"
                  >
                    Get Started Free <ArrowRight size={20} />
                  </Link>
                  <a
                    href="https://github.com/Abdulllah321/omni-rest"
                    className="btn-premium btn-premium-secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Terminal size={20} /> View Source
                  </a>
                </div>
                <div className="hero-badges">
                  <span className="hero-badge">
                    <ShieldCheck
                      size={17}
                      style={{ color: "var(--accent-1)" }}
                    />{" "}
                    Security First
                  </span>
                  <span className="hero-badge">
                    <Zap size={17} style={{ color: "var(--accent-2)" }} /> Zero
                    Config
                  </span>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-glow hero-glow--blue" />
                <div className="hero-glow hero-glow--purple" />
                <div
                  className="animate-float glass-card"
                  style={{ padding: "1rem", position: "relative", zIndex: 10 }}
                >
                  <Image
                    src="/hero_visual.png"
                    alt="Omni Rest Architecture"
                    width={600}
                    height={450}
                    className="rounded-xl"
                    style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="page-section">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="section-header">
              <h2 className="section-title">Engineered for Velocity</h2>
              <p className="section-sub">
                Everything you need to ship high-performance backends without
                the mental overhead of manual route definition.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Cpu size={28} />,
                  title: "Intelligent Introspection",
                  body: "Automatically detects your Prisma models, relations, and types to build a perfectly mirrored REST structure.",
                },
                {
                  icon: <Database size={28} />,
                  title: "Powerful Query Engine",
                  body: "Built-in support for complex filtering, sorting, and pagination out of the box. No extra code required.",
                },
                {
                  icon: <Lock size={28} />,
                  title: "Granular Protection",
                  body: "Secure your endpoints with fine-grained guards. Control access at the model or even operation level.",
                },
              ].map((f, i) => (
                <div key={i} className="feature-card-v2">
                  <div className="feature-icon-v2">{f.icon}</div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-body">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Code Demo ── */}
        <section className="code-section">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="section-title" style={{ textAlign: "left" }}>
                  Write code that scales
                </h2>
                <p
                  className="section-sub"
                  style={{ textAlign: "left", margin: "1rem 0 2rem" }}
                >
                  Focus on your business logic, let Omni Rest handle the
                  repetitive plumbing. It integrates seamlessly into your
                  existing stack.
                </p>
                <ul className="checklist">
                  {[
                    "Auto-generated OpenAPI/Swagger docs",
                    "Bulk update and delete operations",
                    "Operation-level hooks for auditing",
                    "Custom middleware support",
                  ].map((item, i) => (
                    <li key={i} className="checklist-item">
                      <span className="checklist-dot">
                        <ArrowRight size={11} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="code-preview">
                <div className="code-header">
                  <div className="dot dot-red" />
                  <div className="dot dot-yellow" />
                  <div className="dot dot-green" />
                  <span
                    style={{
                      marginLeft: "0.75rem",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontFamily: "monospace",
                    }}
                  >
                    server.ts
                  </span>
                </div>
                <pre className="code-body">
                  <code>
                    <span className="tok-kw">import</span> express{" "}
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">"express"</span>;{"\n"}
                    <span className="tok-kw">import</span>{" "}
                    {"{ expressAdapter }"} <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">"omni-rest/express"</span>;
                    {"\n\n"}
                    <span className="tok-cmt">
                      {"// 🚀 Mount your Prisma-powered API"}
                    </span>
                    {"\n"}
                    app.<span className="tok-fn">use</span>(
                    <span className="tok-str">"/api"</span>,{" "}
                    <span className="tok-id">expressAdapter</span>(prisma));
                  </code>
                </pre>
                <div className="endpoints-block">
                  <div className="endpoints-header">
                    <span className="endpoints-label">Resulting Endpoints</span>
                    <span className="endpoints-badge">AUTO-GENERATED</span>
                  </div>
                  <div className="endpoints-list">
                    <div className="endpoint-row">
                      <span className="method method--get">GET</span>
                      <span className="endpoint-path">/api/user/:id</span>
                    </div>
                    <div className="endpoint-row">
                      <span className="method method--post">POST</span>
                      <span className="endpoint-path">/api/product</span>
                    </div>
                    <div className="endpoint-row">
                      <span className="method method--patch">PATCH</span>
                      <span className="endpoint-path">
                        /api/order/bulk/update
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Frameworks ── */}
        <section className="page-section">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="section-header">
              <h2 className="section-title">Agnostic by Design</h2>
              <p className="section-sub">
                Works with the libraries you already love.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { name: "Express.js", icon: "logos:express", invert: true },
                { name: "Next.js", icon: "logos:nextjs-icon", invert: true },
                { name: "Fastify", icon: "logos:fastify-icon", invert: true },
                { name: "Koa", icon: "logos:koa", invert: true },
                { name: "Hapi", icon: "logos:hapi", invert: false },
                { name: "NestJS", icon: "logos:nestjs", invert: false },
              ].map((fw, i) => (
                <div key={i} className="framework-card">
                  <Icon
                    icon={fw.icon}
                    width={32}
                    height={32}
                    className={fw.invert ? "fw-icon-invert" : ""}
                  />
                  <span className="framework-name">{fw.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="page-section">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="glass-card cta-card">
              <div className="cta-bar" />
              <h2 className="cta-title">
                Ready to accelerate your development?
              </h2>
              <p className="cta-body">
                Join hundreds of developers building faster with Omni Rest.
              </p>
              <Link href="/docs" className="btn-premium btn-premium-primary">
                Start Building Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="container mx-auto px-6 max-w-7xl footer-inner">
          <div className="footer-logo">
            <Image
              src="/logo-removebg.png"
              alt="Omni Rest"
              width={32}
              height={32}
              className="footer-logo-img"
            />
            Omni Rest
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear().toLocaleString()} Omni Rest. Built for the Prisma community.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link">
              Twitter
            </a>
            <a href="#" className="footer-link">
              GitHub
            </a>
            <a href="#"  className="footer-link">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
