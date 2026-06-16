# Estrutura do Monorepo

## Visão geral

```
hotel-paraiso/
├── apps/                     # Aplicações executáveis
│   ├── web/                  # Next.js público
│   ├── api/                  # Fastify backend
│   ├── admin/                # Next.js admin
│   ├── cms/                  # Payload CMS
│   └── workers/              # BullMQ workers
├── packages/                 # Bibliotecas compartilhadas
│   ├── database/             # Prisma client + schema
│   ├── artax-client/         # SDK Artax tipado
│   ├── shared-types/         # Zod schemas + types
│   ├── tracking/             # Lib eventos client+server
│   ├── ui/                   # Componentes compartilhados
│   ├── config/               # ESLint/TS/Tailwind shared
│   └── learning/             # Regras defensivas + checkers
├── docs/                     # ⭐ Memória do projeto
│   ├── architecture/         # Blueprints, princípios, stack
│   ├── decisions/            # ADRs
│   ├── incidents/            # Post-mortems
│   ├── experiments/          # Experimentos A/B
│   ├── runbooks/             # Procedimentos operacionais
│   ├── defensive-rules/      # Regras ativas
│   └── api-contracts/        # Specs Artax e nossas APIs
├── infra/                    # Infraestrutura como código
│   ├── docker/               # Compose files
│   ├── easypanel/            # Configs de deploy
│   ├── caddy/                # Reverse proxy
│   └── github-actions/       # CI/CD workflows
├── scripts/                  # Scripts auxiliares
│   ├── bootstrap.sh
│   ├── sync-artax.sh
│   ├── dev-up.sh
│   ├── dev-down.sh
│   └── learn-check.ts
├── .claude/                  # Configs Claude Code
│   ├── settings.local.json   # Permissões pré-aprovadas
│   └── commands/             # Slash commands customizados
├── .github/
│   └── workflows/
├── CLAUDE.md                 # Índice do projeto (enxuto)
├── README.md
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── renovate.json
└── .env.example
```

## Convenções de nomenclatura

**Apps** — kebab-case, descritivo do produto (`web`, `api`, `admin`)

**Packages** — kebab-case, prefixo opcional `@hotel-paraiso/`:

- `@hotel-paraiso/database` (interno)
- `@hotel-paraiso/artax-client`
- `@hotel-paraiso/shared-types`

**Arquivos:**

- Componentes React — PascalCase (`RoomCard.tsx`)
- Hooks — camelCase com `use` (`useAvailability.ts`)
- Utilities — camelCase (`formatDate.ts`)
- Tipos — PascalCase (`Booking.ts`)
- Constantes — UPPER_SNAKE_CASE
- Rotas Next — minúsculas (`/quartos/[slug]/page.tsx`)

## Boundary rules

| De → Para                               | Permitido?         |
| --------------------------------------- | ------------------ |
| `apps/*` → `packages/*`                 | ✅ Sim             |
| `packages/*` → `apps/*`                 | ❌ Nunca           |
| `apps/web` → `apps/api` (import direto) | ❌ Apenas via HTTP |
| `apps/api` → `apps/web`                 | ❌ Nunca           |
| `packages/database` → outros packages   | ✅ Sim             |
| Qualquer → `packages/config`            | ✅ Sim (configs)   |

Validado por ESLint rule `no-restricted-imports`.

## Boundary do domínio

Dentro de `apps/api`, separar em:

```
apps/api/src/
├── domain/           # Lógica pura, zero infra
│   ├── booking/
│   ├── availability/
│   ├── guest/
│   └── ...
├── infrastructure/   # Implementações concretas
│   ├── artax/        # ArtaxClient
│   ├── database/     # Repositories
│   ├── queue/        # BullMQ workers
│   └── tracking/     # GA4 + Meta CAPI
├── interface/        # HTTP, webhooks
│   ├── routes/
│   ├── webhooks/
│   └── middleware/
└── shared/           # Utilities, types, errors
```

**Regra:** `domain/` não importa de `infrastructure/` nem `interface/`. Apenas o oposto.
