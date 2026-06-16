# Roadmap

> 7 fases. Sem deadline. Critério de "pronto" definido por fase.

## Status atual: **Fase 0 — Fundação do repositório**

## Fase 0 — Fundação do repositório

**Objetivo:** repositório inicializado, stack local rodando, CI verde.

**Tarefas:**

- Bootstrap monorepo (Turborepo + pnpm)
- Configs base (TS estrito, ESLint, Prettier, Husky, commitlint)
- Docker Compose local (Postgres 16 + Redis 7)
- Apps placeholder com `package.json` válidos
- Packages base inicializados
- Estrutura `docs/` completa
- CI GitHub Actions (lint + typecheck + test)
- Slash commands em `.claude/commands/`
- ADR-0001 (monorepo), ADR-0002 (stack), ADR-0003 (conclusão)

**Pronto quando:**

- `pnpm install && pnpm dev` sobe stack local
- `pnpm lint && pnpm typecheck && pnpm test` passam
- CI verde no primeiro PR
- Hello world acessível em `localhost:3000` (web) e `localhost:3001/health` (api)

## Fase 0.5 — Contas e credenciais

**Objetivo:** todas as contas externas criadas e configuradas.

**Tarefas:**

- Hostinger: domínio `hotelparaiso.moreirads.cloud` apontando para VPS
- Cloudflare: zona configurada, DNS proxy ativo
- Sentry: projeto criado, DSN no `.env.local`
- GA4: propriedade criada, Measurement ID configurado
- GTM: container criado, atrelado a GA4
- Google Ads: conta conectada, conversões configuradas
- Meta Business: conta configurada, Pixel + CAPI
- Resend: conta + domínio verificado para envio
- Easypanel: projeto criado, ambiente pronto

**Pronto quando:**

- Todos os IDs/tokens em `.env.local`
- Doc `docs/credentials.md` (local, gitignored) mapeia todos
- DNS responde no domínio
- Easypanel deploya hello world com SSL

## Fase 1 — Integração Artax

**Objetivo:** sistema sabe conversar com a Artax em todas as operações documentadas.

**Tarefas:**

- `packages/artax-client` completo (todos endpoints documentados)
- Circuit breaker + retry + rate limit interno
- MSW mocks para desenvolvimento offline
- Prisma schema com entidades operacionais
- ArtaxService no backend
- Webhook receiver com validação de assinatura
- Job de reconciliação diária (BullMQ)
- Testes integração contra mock

**Pronto quando:**

- Reserva criada via `POST /api/bookings` local aparece no Artax
- Webhook `booking_canceled` do Artax atualiza banco local
- Reconciliação diária roda e detecta divergências
- Suite de testes >90% coverage em `artax-client`

## Fase 2 — CMS e conteúdo

**Objetivo:** conteúdo rico cadastrável e servível.

**Tarefas:**

- Payload CMS instalado, conectado ao Postgres
- Coleções: Rooms, Experiences, Gallery, Pages, BlogPosts, Settings
- i18n pt/en em todas as coleções
- Casamento `room_type_id` Artax ↔ `RoomContent` Payload
- API que combina disponibilidade (Artax) + conteúdo (CMS)
- Upload de imagens com otimização (sharp)

**Pronto quando:**

- Cadastro de quarto bilíngue funciona via admin Payload
- Endpoint `/api/rooms` retorna conteúdo + disponibilidade casados
- Imagens servidas otimizadas (WebP, AVIF, srcset)

## Fase 3 — Frontend público

**Objetivo:** site institucional + motor de reservas funcionais e performáticos.

**⚠️ Pré-requisito de início:** **Solicitar identidade visual ao cliente** (ver `docs/design/references/PENDING.md` → BRAND-001). Sem IDV, sistema continua com fallback temporário.

**Tarefas:**

- Solicitar IDV e referências de concorrentes (BRAND-001, REF-001)
- Next.js com i18n setup completo
- Páginas: home, sobre, gastronomia, experiências, galeria, contato, quartos
- Motor de reservas: search → quartos → checkout → confirmação
- Aplicar tokens de design (`packages/ui/src/tokens/`) consumindo IDV
- Design system shadcn customizado com brand tokens
- Otimização Core Web Vitals
- Proteções anti-cópia (ofuscação, watermarking, headers)
- SEO completo (sitemap, robots, schema.org, OG, twitter cards)

**Pronto quando:**

- Lighthouse >95 em todas as páginas (mobile e desktop)
- LCP <1.5s, INP <100ms, CLS <0.05
- Fluxo de reserva end-to-end em homologação
- Responsivo perfeito em 320px, 768px, 1024px, 1440px, 1920px
- IDV aplicada (ou aprovada decisão de continuar com fallback até IDV chegar)

## Fase 4 — Tracking e funil

**Objetivo:** jornada completa rastreada, eventos chegando em todas as plataformas.

**Tarefas:**

- GTM client-side configurado
- DataLayer estruturado em todas as páginas
- Eventos macro e micro implementados
- Backend dispara GA4 MP + Meta CAPI em paralelo
- Persistência local em `analytics_events`
- Atribuição UTM + click IDs ponta a ponta
- Conversões mapeadas em Google Ads e Meta
- Dashboard de funil no admin

**Pronto quando:**

- Jornada de teste gera eventos corretos em GA4 + Ads + Meta + banco local
- Deduplicação cliente/servidor funciona
- Atribuição correta com gclid e fbclid em conversão

## Fase 5 — Painel admin e observabilidade

**Objetivo:** visão completa do sistema e da jornada.

**Tarefas:**

- Admin Next.js + NextAuth
- Dashboards: reservas, sessões, conversões, performance, sistema
- Timeline de jornada por usuário
- Painel de incidentes (LearningService)
- Sentry integrado
- Grafana + Loki + Prometheus auto-hospedados
- Alertas no Slack/WhatsApp
- Painel de regras defensivas ativas

**Pronto quando:**

- Jornada completa visível no admin
- Alerta no WhatsApp se Artax cair >2min
- Dashboards de performance atualizando em tempo real
- Incidentes do Sentry aparecem no painel automaticamente

## Fase 6 — Hardening e lançamento

**Objetivo:** sistema production-ready, validado, com runbooks.

**Tarefas:**

- E2E Playwright cobrindo cenários críticos
- Load testing com k6 (100 users simultâneos)
- Smoke tests pós-deploy automáticos
- Runbooks de 5+ cenários de incidente
- Backups Postgres validados (restore testado)
- DNS de produção apontando
- Política de rollback automático
- Documentação de operação completa

**Pronto quando:**

- Suporta 100 usuários simultâneos sem degradar
- Site no domínio final com SSL A+
- Runbooks revisados
- Backup restore testado em ambiente isolado
- Plano de comunicação de incidentes definido

## Fases futuras (v2+)

- Pagamento online (Pix, cartão) — modular, plug-in
- s-GTM (server-side Google Tag Manager)
- Área do hóspede (login, ver reservas, cancelar)
- Programa de fidelidade
- Múltiplas tarifas e cancelamento flexível por plano
- App mobile (React Native?)
- Multi-propriedade (mais de um hotel)
