# INC-002: DR-001 bypassada em produção por 100% do tráfego real

**Data da detecção:** 2026-08-26
**Severidade:** crítica (potencial de desativação permanente da chave do PMS)
**Status:** resolvido
**Detectado por:** auditoria pré-tráfego pago (Claude + Codex)

## Resumo

A DR-001 nasceu do incidente de 2026-06-18, quando a chave da API Artax foi desativada
permanentemente. A proteção foi implementada corretamente em `packages/artax-client/`
— rate limiter, circuit breaker, retry e timeout — e **nunca foi usada pelo app web**.

As três rotas que falam com a Artax (`/api/availability`, `/api/bookings`, `/api/sync`)
chamavam `https://artaxnet.com` com `fetch()` cru, sem importar o pacote. A regra existia,
o código existia, e o caminho que recebia todo o tráfego real passava por fora.

## Impacto

Nenhum incidente ocorreu, mas a exposição era total e iminente:

- `/api/availability` fazia uma chamada à Artax por busca, sem cache
- ~2 buscas por segundo ultrapassam os 102 req/60s que desativam a chave
- Esse volume é modesto para campanha paga, que estava prestes a ser ligada
- A desativação é permanente e só reversível por contato com o suporte da Artax
- O dano derruba a operação do hotel inteira, não apenas o site

## Causa raiz

A proteção foi construída num pacote compartilhado, mas **nada impedia contorná-la**. Não
havia regra de lint, teste ou verificação que detectasse `fetch()` direto para o host da
Artax. A conformidade dependia de lembrança humana.

Agravantes encontrados dentro da própria proteção:

1. `client.ts` instanciava `RateLimiter(90, 60_000)` com o comentário "we stay at 90 to be
   safe". Noventa deixa 10 requests de folga para um limite cuja ultrapassagem é
   irreversível — e o limiter é por processo, então duas réplicas somam 180/min.
2. `withRetry` fazia retry em **429**, exatamente o status que a Artax devolve ao se
   aproximar do limite. Uma chamada lógica virava três reais no pior momento possível.

## Correção aplicada

- As três rotas migradas para `@hotel-paraiso/artax-client` via `apps/web/src/lib/artax.ts`
  (instância única por processo, para que os contadores sejam de fato compartilhados)
- `RateLimiter` reduzido de 90 para 50, conforme a DR-001 sempre exigiu
- `withRetry` deixou de repetir qualquer 4xx, 429 incluído
- Cache de disponibilidade de 5 minutos implementado (`lib/availability.ts`) — requisito
  nº 4 da DR-001 que nunca havia saído do papel
- Rate limit por IP em `/api/availability`
- **DR-002 criada**: regra ESLint que proíbe citar `artaxnet.com` fora do pacote

## Lição

Uma regra defensiva só vale se for **impossível de contornar sem perceber**. Documentar e
implementar não bastam quando a violação é silenciosa: o `fetch()` direto funcionava
perfeitamente, respondia 200, e nada indicava que a proteção tinha sido pulada.

Toda DR daqui em diante precisa responder: _"o que faz esta regra falhar em voz alta?"_
Se a resposta for "revisão de código", a regra ainda não está pronta.

## Referências

- `docs/defensive-rules/DR-001-artax-rate-limit.md`
- `docs/defensive-rules/DR-002-artax-client-obrigatorio.md`
- `docs/plans/REMEDIACAO_PRE_TRAFEGO.md` — Fase 0
