# Hotel Paraíso — Plataforma Digital

> Sistema integrado de reservas online com aprendizado contínuo, integrado à Artax PMS.

## Visão geral

Plataforma digital que combina:

- **Site institucional bilíngue** (pt/en)
- **Motor de reservas próprio** integrado em tempo real com Artax PMS
- **Tracking de funil completo** (GA4, Google Ads, Meta Ads)
- **Painel admin** com observabilidade total
- **Sistema de aprendizado contínuo** — cada erro fortalece o todo

## Documentação

Toda documentação está em `docs/`. Comece por:

1. [`CLAUDE.md`](./CLAUDE.md) — índice de tudo (lido automaticamente pelo Claude Code)
2. [`docs/architecture/MASTER_BLUEPRINT.md`](./docs/architecture/MASTER_BLUEPRINT.md) — visão completa
3. [`docs/architecture/PRINCIPLES.md`](./docs/architecture/PRINCIPLES.md) — princípios fundamentais

## Setup rápido (após Fase 0)

```bash
# Instalar dependências
pnpm install

# Subir infra local (Postgres + Redis)
./scripts/dev-up.sh

# Rodar todos os apps em paralelo
pnpm dev
```

Acessar:

- Site público: http://localhost:3000
- API: http://localhost:3001
- Admin: http://localhost:3002
- CMS: http://localhost:3003

## Stack

Next.js 15 + Fastify 5 + Prisma 6 + PostgreSQL 16 + Redis 7 + Payload CMS 3 + Tailwind 4 + shadcn/ui

Stack completa: [`docs/architecture/STACK.md`](./docs/architecture/STACK.md)

## Estrutura

Monorepo com Turborepo + pnpm workspaces. Detalhes em [`docs/architecture/STRUCTURE.md`](./docs/architecture/STRUCTURE.md).

## Fase atual

Ver [`docs/architecture/ROADMAP.md`](./docs/architecture/ROADMAP.md).

## Contribuindo

- Conventional Commits obrigatório
- TypeScript estrito
- Todo bug analisado vira defensive rule + teste
- ADR para qualquer decisão arquitetural

Detalhes: [`docs/architecture/CODE_STANDARDS.md`](./docs/architecture/CODE_STANDARDS.md)

## Licença

Proprietário — Moreira Digital. Todos os direitos reservados.
