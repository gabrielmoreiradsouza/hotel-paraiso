# Plano de remediação pré-tráfego pago

> Consolidação da auditoria OWASP (Claude) + revisão adversarial (Codex) — 2026-08-26.
> Nenhum tráfego pago deve ser ligado antes da Fase 3 concluída e da Fase 4 validada.

## Princípio de ordenação

Ordenado por **irreversibilidade do dano**, não por severidade nominal:

1. O que mata o negócio de forma permanente (chave do PMS, reserva fantasma)
2. O que corrompe dinheiro e decisão (conversões, preço)
3. O que expõe acesso (auth)
4. O que degrada sob carga (infra)
5. Validação

---

## Fase 0 — Contenção imediata ✅ CONCLUÍDA (2026-08-26)

> `pnpm test` 11/11 · typecheck limpo · lint limpo · build ok · `learn-check` 0 críticos.
> Achados extras corrigidos no caminho: `RateLimiter` estava em 90 (agora 50, conforme
> DR-001) e `withRetry` fazia retry de 429 — o status que antecede a desativação da chave.

### 0.1 Restaurar DR-001 no caminho de produção — CRÍTICO

**Problema:** `availability/route.ts:34`, `bookings/route.ts:236,303` e `sync/route.ts:34` chamam
`https://artaxnet.com` com `fetch()` cru. Nenhuma importa `@hotel-paraiso/artax-client`.
Rate limiter (30 req/60s), circuit breaker e cache de 5 min da DR-001 estão bypassados.

**Risco:** Artax desativa a chave **permanentemente** em 102 req/60s (incidente 2026-06-18,
recuperação só via suporte). ~2 buscas/segundo já estouram o limite. Derruba o hotel inteiro,
não só o site.

**Fix:**

- Migrar as 3 rotas para `@hotel-paraiso/artax-client`
- Adicionar `apps/web/package.json` → dependência do pacote
- Regra ESLint: proibir string literal `artaxnet.com` fora de `packages/artax-client/`
- Criar `DR-002`: toda chamada Artax passa obrigatoriamente pelo client

### 0.2 Matar o fallback de reserva fantasma — CRÍTICO

**Problema:** `bookings/route.ts:208,275-284` — sem `categoryId`/`rateplanId` a API responde
`success: true`, dispara e-mail + WhatsApp de confirmação, e **não cria nada no PMS**.

**Risco:** hóspede chega com confirmação e não tem quarto. Overbooking e dano reputacional.

**Fix:** remover o caminho de fallback. Sem Artax confirmada, retornar erro explícito e
oferecer o telefone. Nunca confirmar o que não foi persistido.

### 0.3 Timeout em toda dependência externa — CRÍTICO

**Problema:** Artax, Evolution, Resend, GA4 e Meta chamados sem `AbortSignal`
(`bookings/route.ts:47-54,121-142,236-240`; `server-tracking.ts:30-51,83-108`).

**Risco:** Artax lenta → requests empilham → esgota o pool → app cai. É o modo de falha
clássico sob tráfego.

**Fix:** `AbortSignal.timeout(5000)` para Artax, `3000` para os fire-and-forget.

---

### 0.4 Schema Artax reconciliado com a API real ✅ (fora do plano original)

Verificado com 2 requisições manuais (limite DR-001: 3) em 2026-08-26.
`BookingListResponseSchema` descrevia campos que a Artax nunca devolveu:

| Schema antigo                           | Realidade                                 |
| --------------------------------------- | ----------------------------------------- |
| `arrival_date` / `departure_date`       | `checkin` / `checkout`                    |
| `pagination: { total_items, per_page }` | `total_bookings` / `current_page` na raiz |
| `rooms: array`                          | `units: string`                           |
| `total_amount`                          | ausente na listagem                       |

Nunca falhou porque `client.ts` faz `as T` em vez de `.parse()`. Corrigido junto:

- `syncBooking` gravava `new Date(undefined)` (Invalid Date) em toda sincronização
- `createBooking` do `apps/api` gravava status por acidente (`?? 1`), agora explícito
- Mocks do MSW espelhavam a ficção — o CI validava contra resposta inexistente
- Removido `|| true` do `typecheck` do `apps/api`; portão testado com erro proposital

**Pendente:** verificar o formato de `GET /booking/:id`, não checado (cota da sessão
esgotada), e o item 1.6 abaixo.

### 1.6 Ligar validação em runtime no ArtaxClient — ALTO

`client.ts:272` faz `return (await response.json()) as T` — cast, não validação. Foi o que
permitiu o schema divergir da realidade sem um único erro. Trocar por `.parse()` com os
schemas agora corrigidos. **Ordem importa:** validar antes de corrigir o schema derrubaria
toda chamada Artax.

---

## Fase 1 — Integridade de reserva e de dados

## ✅ CONCLUÍDA (2026-08-27)

> Todos os itens 1.1 a 1.6 entregues. `pnpm test` 11/11 · typecheck 11/11 · lint limpo ·
> build ok · `learn-check` 0 críticos.
>
> O bloqueio de armazenamento foi resolvido pela **ADR-0011: Redis no `apps/web`**.
> **Pendência operacional:** provisionar o Redis no Easypanel e definir `REDIS_URL`. Até lá
> o app roda em modo degradado — idempotência protege dentro de cada réplica, não entre elas.

### 1.1 Idempotência no POST /api/bookings — CRÍTICO

**Problema:** `bookings/route.ts:236` — sem chave de idempotência nem lock. Double-click,
retry de proxy ou navegador criam múltiplas reservas reais + múltiplos WhatsApp + múltiplas
conversões. Viola `CODE_STANDARDS.md:86-96`.

**Fix:** header `Idempotency-Key` gerado no cliente; cache do resultado por chave (Redis, TTL 24h);
retorno do mesmo `booking_id` em repetição. Redis já existe em `infra/docker/docker-compose.yml:20`.

### 1.2 Revalidar campos operacionais no servidor — CRÍTICO

**Problema:** `bookings/route.ts:152,214-234` — `categoryId`, `rateplanId`, `adults`, `kids`
vêm do JSON do cliente sem revalidação contra disponibilidade real.

**Fix:** reconsultar disponibilidade no servidor e confirmar que a combinação existe, tem
`allots > 0` e comporta a ocupação, antes de criar.

### 1.3 Preço de conversão vem do servidor — ALTO

**Problema:** `bookings/route.ts:254` — `body.totalPrice` do cliente alimenta GA4 MP e Meta CAPI.

**Risco:** valor de conversão forjável → otimização de campanha corrompida. Você toma decisão
de orçamento em cima de número falso.

**Fix:** derivar o valor da resposta da Artax; ignorar `totalPrice` do payload.

### 1.4 Bloquear eventos de alta integridade vindos do browser — ALTO

**Problema:** `events/route.ts:16-23` — qualquer um posta `reservation_created`.

**Fix:** Zod schema; rejeitar `reservation_created`/`purchase` vindos do cliente (403);
rate limit por IP; mover o store para Redis (hoje é array por processo — diverge entre
réplicas e zera todo deploy, `events/route.ts:13`).

### 1.5 Parar de vazar erro upstream — ALTO

**Problema:** `bookings/route.ts:242,264-269` — corpo bruto da resposta Artax devolvido no
campo `details`.

**Fix:** logar server-side com `requestId`; devolver mensagem genérica + 502.

---

## Fase 2 — Autenticação e autorização ✅ CONCLUÍDA (2026-08-27)

> `pnpm test` 11/11 (17 no web) · typecheck 11/11 · lint limpo · build ok ·
> `learn-check` 0 críticos.
>
> **Impacto operacional:** o formato do token de sessão mudou. Sessões de admin abertas
> foram invalidadas — é necessário fazer login de novo. Isso é o efeito pretendido: o
> token antigo era replayável indefinidamente.
>
> `ARTAX_WEBHOOK_TOKEN` adicionado ao `.env.example`. Enquanto não estiver definido, o
> webhook segue aceitando sem verificar e registra WARN — estado permissivo visível em
> vez de silencioso, para não quebrar a integração antes do token ser provisionado.

### 2.1 Módulo central de sessão admin — ALTO

**Problema:** a mesma verificação está duplicada em 4 lugares
(`bookings/route.ts:32-40`, `events/route.ts:37-48`, `sync/route.ts:9-17`, emissão em
`admin/auth/route.ts:18-27`). Divergem com o tempo.

**Fix:** `apps/web/src/lib/admin-session.ts` como única fonte.

### 2.2 Token de sessão assinado com nonce e expiração — ALTO

**Problema:** `admin/auth/route.ts:20` — token é sempre `HMAC(ADMIN_PASSWORD, 'admin')`.
O `maxAge: 8h` do cookie é dica de cliente; o servidor não valida expiração nem identidade
de sessão. Token capturado é replayável até a senha mudar.

**Fix:** payload assinado com `sessionId: randomUUID()` + `expiresAt`, validado no servidor.
Habilita revogação individual (hoje só existe revogação global por rotação de senha).

### 2.3 Comparação constant-time — MÉDIO

**Problema:** `admin/auth/route.ts:18` (`password === correct`) e as comparações de sessão em
`bookings:38-39`, `events:47-48`, `sync:15-16`.

**Fix:** `timingSafeEqual` sobre digests de tamanho fixo. Resolve junto com 2.1.

### 2.4 Autenticar o webhook Artax — MÉDIO

**Problema:** `webhooks/artax/route.ts:3` — sem segredo nem assinatura; loga payload completo
com PII (`:22`) e corpo não-JSON (`:12`); sem rate limit; `JSON.parse` aceita `null`/array/primitivo.

**Nota de calibragem:** o handler hoje só loga e responde 200 — não altera estado. O impacto
real é falsificação de log, exposição de PII e DoS de disco, não comprometimento de integridade.
Prioridade correta é média, não crítica.

**Fix:** segredo compartilhado ou verificação de assinatura; Zod no payload; logar apenas
`event` + `bookingId`; limite de tamanho de body.

---

## Fase 3 — Resiliência sob carga ✅ CONCLUÍDA (2026-08-27)

> `pnpm test` 11/11 (21 no web) · typecheck 11/11 · lint limpo · build ok ·
> `learn-check` 0 críticos.
>
> **Redis provisionado:** serviço `hp-redis` (redis:7-alpine) criado no projeto `lp-mds`
> do Easypanel, isolado dos Redis existentes de Evolution API e n8n. `REDIS_URL`
> configurada no serviço `hotel-paraiso`, com as 10 variáveis anteriores preservadas.
>
> **CSP com `'unsafe-inline'` em `script-src`** — concessão consciente, documentada em
> `next.config.ts`. Migrar para nonce exige middleware e desliga geração estática.

### 3.1 GC no rate limiter + store distribuído — ALTO

**Problema:** `lib/rate-limit.ts:1` — chaves nunca são removidas do `Map`. Cada IP novo é
entrada permanente → crescimento monotônico → OOM. Além disso é por processo: com N réplicas
o limite efetivo é N×.

**Fix:** curto prazo, `requests.delete(key)` quando esvazia + sweep periódico com `.unref()`.
Correto: Redis com TTL e operação atômica.

### 3.2 IP confiável para rate limit — MÉDIO

**Problema:** `admin/auth/route.ts:7`, `bookings/route.ts:146` — `x-forwarded-for` usado cru
como chave; variar o header dá bucket novo.

**Ressalva:** explorabilidade depende de o proxy de produção reescrever o header. **Verificar
a config do Cloudflare/Easypanel antes de dimensionar o esforço.**

**Fix:** extrair e validar o IP do header que o proxy garante (`CF-Connecting-IP`).

### 3.3 Cache e rate limit em /api/availability — ALTO

**Problema:** `availability/route.ts:60,93-97` — sem cache, sem rate limit, síncrono na Artax.
Baseline medido com k6: **680ms com 1 usuário**.

**Fix:** cache de 5 min conforme DR-001 (chave = datas + ocupação) + rate limit por IP.
Absorvido em grande parte pela Fase 0.1.

### 3.4 CSP e HSTS — MÉDIO

**Problema:** `next.config.ts:26` já traz `X-Frame-Options`, `nosniff`, `Referrer-Policy` e
`Permissions-Policy`. Faltam CSP e HSTS.

**Fix:** CSP com allowlist de GTM/GA/Meta; HSTS `max-age=31536000; includeSubDomains`.

---

## Fase 4 — Validação (gate de liberação) — PARCIAL

> ✅ 4.1 e2e não cria mais reserva real (rota interceptada; o fluxo de UI continua sendo
> exercitado, e o teste agora também exige que o cliente envie `Idempotency-Key`).
> ✅ 4.4 `INC-002` e `DR-002` criados e registrados em `ACTIVE.md`.
> ✅ Extra: corrigido falso positivo do `learn-check` que fazia a regra DR-001 acusar a
> própria documentação da DR-002. Verificado nos dois sentidos.
>
> ⏳ **4.2 e 4.3 bloqueados por deploy.** O código novo ainda não está em produção e não
> existe ambiente de staging para o `hotel-paraiso` no Easypanel. Rodar k6 contra a
> produção atual mediria o código antigo — e, sem as correções da Fase 0 no ar, mataria
> a chave do PMS.

### 4.1 e2e para de criar reserva real

`e2e/booking-flow.spec.ts:52` cria reserva real na Artax a cada CI e dispara WhatsApp pro hotel.
Também consome cota da DR-001. Migrar para MSW mocks.

### 4.2 Carga em staging, nunca em produção

```bash
BASE_URL=https://staging.hotelparaiso.moreirads.cloud k6 run perf/availability-load.js
```

**Só depois da Fase 0.1.** Enquanto as rotas chamarem a Artax direto, o teste mata a chave
do PMS — a DR-001 proíbe explicitamente loop contra a API real.

### 4.3 Provar que os vetores fecharam

```bash
BASE_URL=https://staging.hotelparaiso.moreirads.cloud k6 run perf/abuse-probe.js
```

Thresholds só passam se rate limit e rejeição de eventos estiverem funcionando.

### 4.4 Artefatos de aprendizado

Conforme `CLAUDE.md`: `INC-002` (DR-001 bypassada em produção) e `DR-002` (toda chamada Artax
passa pelo client, com ESLint + teste).

---

## Resumo de gates

| Gate                | Bloqueia                      |
| ------------------- | ----------------------------- |
| Fase 0 completa     | Qualquer deploy               |
| Fases 1–2 completas | Abrir o site pra tráfego pago |
| Fase 3 completa     | Escalar orçamento de campanha |
| Fase 4 validada     | Considerar o sistema estável  |

---

## Bloqueio: estado no `apps/web`

A idempotência do `POST /api/bookings` (1.1) e o store distribuído de eventos (1.4) exigem
estado compartilhado entre requests e entre réplicas. Levantamento de 2026-08-26:

- **Nenhum cliente Redis instalado** em nenhum package do monorepo
- **`apps/web` não tem acesso a banco** — não depende de `@hotel-paraiso/database` nem de Prisma
- O `Dockerfile` do web não recebe `DATABASE_URL` nem `REDIS_URL`
- `infra/docker/docker-compose.yml` provisiona Postgres e Redis, mas é ambiente **local**;
  não há evidência no repositório do que roda no Easypanel de produção

Dar estado ao container web é decisão arquitetural (ADR) e Nível 4 em `PERMISSIONS.md`.
As três opções e seus custos estão registrados para a decisão do owner.
