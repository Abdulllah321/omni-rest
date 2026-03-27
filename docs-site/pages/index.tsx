import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Zap, 
  ShieldCheck, 
  FileText, 
  Search, 
  Lock, 
  RefreshCw, 
  Layers, 
  Terminal, 
  ArrowRight,
  Database,
  Code2,
  Cpu
} from 'lucide-react'

export default function Home() {
  return (
    <>
      <Head>
        <title>Omni Rest | Auto-generate REST APIs from Prisma</title>
        <meta name="description" content="Turn your Prisma schema into a production-ready REST API in seconds. Zero configuration, type-safe, and framework-agnostic." />
        <meta name="og:title" content="Omni Rest" />
        <meta name="og:description" content="Auto-generate REST APIs from your Prisma schema — zero config CRUD endpoints" />
        <meta name="og:image" content="/og-image.png" />
      </Head>

      <div className="bg-mesh" />

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="hero">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-left">
                <div className="glass-pill">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  Now supporting Next.js 14 & Fastify
                </div>
                <h1 className="hero-title">
                  Turn your <span className="text-gradient">Prisma Schema</span> into a Production API
                </h1>
                <p className="hero-subtitle">
                  Stop writing boilerplate CRUD. Omni Rest auto-generates type-safe REST endpoints from your Prisma models in a single line of code.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/docs/getting-started" className="btn-premium btn-premium-primary">
                    Get Started Free
                    <ArrowRight size={20} />
                  </Link>
                  <a href="https://github.com/Abdulllah321/omni-rest" className="btn-premium btn-premium-secondary" target="_blank" rel="noopener noreferrer">
                    <Terminal size={20} />
                    View Source
                  </a>
                </div>
                
                <div className="mt-12 flex items-center gap-6 text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-500" />
                    Security First
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-purple-500" />
                    Zero Config
                  </div>
                </div>
              </div>

              <div className="relative lg:block hidden">
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pulse-slow" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pulse-slow" />
                <div className="animate-float relative z-10 glass-card p-4">
                   <Image 
                    src="/hero_visual.png" 
                    alt="Omni Rest Architecture" 
                    width={600} 
                    height={450} 
                    className="rounded-xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-24 relative">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Engineered for Velocity</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Everything you need to ship high-performance backends without the mental overhead of manual route definition.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="feature-card-v2">
                <div className="feature-icon-v2">
                  <Cpu size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Intelligent Introspection</h3>
                <p className="text-slate-400">
                  Automatically detects your Prisma models, relations, and types to build a perfectly mirrored REST structure.
                </p>
              </div>

              <div className="feature-card-v2">
                <div className="feature-icon-v2">
                  <Database size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Powerful Query Engine</h3>
                <p className="text-slate-400">
                  Built-in support for complex filtering, sorting, and pagination out of the box. No extra code required.
                </p>
              </div>

              <div className="feature-card-v2">
                <div className="feature-icon-v2">
                  <Lock size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Granular Protection</h3>
                <p className="text-slate-400">
                  Secure your endpoints with fine-grained guards. Control access at the model or even operation level.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code Demo */}
        <section className="py-24 bg-slate-900/40 border-y border-slate-800/50">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">Write code that scales</h2>
                <p className="text-slate-400 text-lg mb-8">
                  Focus on your business logic, let Omni Rest handle the repetitive plumbing. It integrates seamlessly into your existing stack.
                </p>
                <ul className="space-y-4">
                  {[
                    "Auto-generated OpenAPI/Swagger docs",
                    "Bulk update and delete operations",
                    "Operation-level hooks for auditing",
                    "Custom middleware support"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <ArrowRight size={12} className="text-blue-400" />
                      </div>
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
                  <span className="ml-4 text-xs text-slate-500 font-mono">server.ts</span>
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code className="text-slate-300">
                    <span className="text-purple-400">import</span> express <span className="text-purple-400">from</span> <span className="text-green-400">"express"</span>;<br />
                    <span className="text-purple-400">import</span> &#123; expressAdapter &#125; <span className="text-purple-400">from</span> <span className="text-green-400">"omni-rest/express"</span>;<br />
                    <br />
                    <span className="text-slate-500">// 🚀 Mount your Prisma-powered API</span><br />
                    app.<span className="text-blue-400">use</span>(<span className="text-green-400">"/api"</span>, <span className="text-yellow-400">expressAdapter</span>(prisma));<br />
                  </code>
                </pre>
                
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resulting Endpoints</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">AUTO-GENERATED</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 w-12">GET</span>
                      <span className="text-slate-400">/api/user/:id</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 w-12">POST</span>
                      <span className="text-slate-400">/api/product</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-yellow-400 w-12">PATCH</span>
                      <span className="text-slate-400">/api/order/bulk/update</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Frameworks */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Agnostic by Design</h2>
              <p className="text-slate-400">Works with the libraries you already love.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "Express.js", icon: <Layers size={24} /> },
                { name: "Next.js", icon: <Layers size={24} /> },
                { name: "Fastify", icon: <Layers size={24} /> },
                { name: "Hapi (Soon)", icon: <Layers size={24} /> },
              ].map((fw, i) => (
                <div key={i} className="glass-card p-6 flex items-center justify-center gap-3 hover:border-blue-500/50 transition-colors cursor-default">
                  <div className="text-blue-500">{fw.icon}</div>
                  <span className="font-semibold text-slate-200">{fw.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <div className="glass-card p-12 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
               <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to accelerate your development?</h2>
               <p className="text-slate-400 mb-10 text-lg">
                 Join hundreds of developers building faster with Omni Rest.
               </p>
               <div className="flex justify-center gap-4">
                <Link href="/docs" className="btn-premium btn-premium-primary">
                  Start Building Now
                </Link>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-900">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
               O
             </div>
             Omni Rest
          </div>
          <div className="text-slate-500 text-sm">
            © 2024 Omni Rest. Built for the Prisma community.
          </div>
          <div className="flex items-center gap-6 text-slate-400">
             <a href="#" className="hover:text-white transition-colors">Twitter</a>
             <a href="#" className="hover:text-white transition-colors">GitHub</a>
             <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </>
  )
}