# Stack Técnica

> Versões fixadas. Atualizações requerem ADR.

## Frontend público (`apps/web`)

| Pacote                | Versão | Função                                      |
| --------------------- | ------ | ------------------------------------------- |
| Next.js               | 15.x   | Framework React, App Router, RSC, Turbopack |
| TypeScript            | 5.x    | Tipagem estrita                             |
| Tailwind CSS          | 4.x    | Estilização                                 |
| shadcn/ui             | latest | Componentes acessíveis                      |
| next-intl             | 3.x    | i18n (pt/en)                                |
| React Hook Form       | 7.x    | Formulários                                 |
| Zod                   | 3.x    | Validação de schemas                        |
| TanStack Query        | 5.x    | Cache de dados servidor                     |
| Framer Motion         | 12.x   | Animações                                   |
| next-build-obfuscator | latest | Ofuscação em produção                       |

## Backend (`apps/api`)

| Pacote                                     | Versão | Função              |
| ------------------------------------------ | ------ | ------------------- |
| Node.js                                    | 22 LTS | Runtime             |
| Fastify                                    | 5.x    | Servidor HTTP       |
| @fastify/cors, helmet, rate-limit, swagger | latest | Plugins essenciais  |
| Prisma                                     | 6.x    | ORM                 |
| BullMQ                                     | 5.x    | Filas               |
| Zod                                        | 3.x    | Validação           |
| Pino + pino-pretty                         | latest | Logging estruturado |
| @opentelemetry/sdk-node                    | latest | Traces distribuídos |

## Admin (`apps/admin`)

- Next.js 15 separado do público
- NextAuth 5 (auth)
- shadcn/ui + Tremor (dashboards)
- Recharts (gráficos customizados)

## CMS (`apps/cms`)

- Payload CMS 3.x self-hosted
- Mesmo Postgres do operacional (schema separado)

## Workers (`apps/workers`)

- Node 22 + BullMQ
- Workers separados: sync, webhooks, reconciliation, anomaly-detection

## Banco e cache

- PostgreSQL 16
- Redis 7

## Observabilidade

- Sentry (free tier inicial, depois Team)
- Grafana + Loki + Prometheus (auto-hospedado via Easypanel)
- OpenTelemetry Collector
- Pino para logs estruturados

## Testes

| Ferramenta    | Função                           |
| ------------- | -------------------------------- |
| Vitest        | Unit + integration               |
| Playwright    | E2E + visual regression          |
| MSW           | Mock Service Worker (Artax mock) |
| k6            | Load testing                     |
| Lighthouse CI | Performance budget               |

## Qualidade e CI

- ESLint (flat config) + Prettier + Husky + lint-staged
- Conventional Commits + commitlint
- GitHub Actions
- Turborepo (build cache, tasks paralelas)
- Renovate (atualizações automáticas)

## Deploy

- Easypanel (Hostinger VPS) — containers Docker
- Caddy — reverse proxy + SSL automático
- Cloudflare — DNS + CDN + WAF

## Comunicação

- Resend (emails transacionais)
- WhatsApp Cloud API (notificações, fase tardia)
- Slack webhook (alertas internos)

## Justificativa das escolhas principais

Ver ADRs específicos em `docs/decisions/`:

- ADR-0001 — Monorepo Turborepo
- ADR-0002 — Stack técnica completa
- ADR-0003 — Fastify vs Express vs Hono
- ADR-0004 — Payload vs Sanity vs Strapi
- ADR-0005 — Easypanel vs Vercel/Railway
