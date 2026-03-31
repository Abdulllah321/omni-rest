# Security Policy

## Supported Versions

Only the latest minor release receives security fixes.

| Version | Supported |
|---------|-----------|
| 0.4.x   | ✅ Yes     |
| < 0.4   | ❌ No      |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report them privately via one of these channels:

- **GitHub Private Vulnerability Reporting** — use the "Report a vulnerability" button on the [Security tab](https://github.com/Abdulllah321/omni-rest/security/advisories/new) of this repo
- **Email** — if you prefer, reach out directly to the maintainer listed in `package.json`

Include as much detail as you can:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- The version of omni-rest affected
- Your Prisma version, Node.js version, and framework adapter in use

## Response Timeline

| Stage | Target |
|-------|--------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Within 30 days for critical issues |
| Public disclosure | After a fix is released |

## Scope

Issues considered in scope:

- Authentication/authorization bypass via guards or middleware
- Prisma query injection through URL parameters or request body
- Information disclosure (exposing models or fields that should be restricted)
- Denial of service via query complexity (unbounded includes, limits, etc.)
- Unsafe defaults in any adapter (Express, Next.js, Fastify, Koa, Hapi, NestJS)

Out of scope:

- Vulnerabilities in Prisma itself — report those to [Prisma's security team](https://www.prisma.io/security)
- Issues in your own application code that uses omni-rest
- Missing security headers (those are the responsibility of the host framework)

## Security Best Practices

When using omni-rest in production:

- Always use the `allow` option to whitelist only the models you intend to expose
- Use `guards` to enforce authentication and authorization per model and method
- Set a reasonable `maxLimit` to prevent large data dumps
- Never expose omni-rest directly to the internet without authentication middleware
- Use `fieldGuards` (coming in a future release) to hide sensitive fields like passwords

## Disclosure Policy

We follow [responsible disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Once a fix is available, we will:

1. Release a patched version
2. Publish a GitHub Security Advisory
3. Add an entry to `CHANGELOG.md` under a `Security` heading

Credit will be given to the reporter unless they prefer to remain anonymous.
