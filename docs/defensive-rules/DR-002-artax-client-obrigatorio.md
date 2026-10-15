# DR-002: Toda chamada à Artax passa obrigatoriamente pelo ArtaxClient

**Origem:** INC-002 (2026-08-26)
**Status:** ativa
**Categoria:** infrastructure
**Resumo:** `fetch()` direto para `artaxnet.com` contorna rate limiter, circuit breaker,
timeout e retry — as proteções que a DR-001 exige. Só `packages/artax-client/` pode citar
o host.

## Regra

1. Nenhum arquivo fora de `packages/artax-client/` pode conter a string `artaxnet.com`
2. Todo acesso à Artax se dá por `ArtaxClient`, obtido via `getArtaxClient()` no app web
3. O cliente é **instância única por processo** — instanciar por request zeraria os
   contadores do rate limiter e do circuit breaker, reabrindo o buraco que a regra fecha
4. Endpoint novo da Artax vira método novo no `ArtaxClient`, nunca `fetch()` na rota

## Por que existe

A DR-001 já obrigava rate limiter e circuit breaker, e ambos estavam implementados. Ainda
assim, 100% do tráfego real passava por fora deles durante meses (ver INC-002). A regra
anterior dependia de lembrança; esta é verificada mecanicamente.

## Implementação

- `eslint.config.js` — `no-restricted-syntax` bloqueia literal e template contendo
  `artaxnet.com` em `apps/**` e `packages/**`, exceto `packages/artax-client/**`
- `apps/web/src/lib/artax.ts` — singleton do cliente para o app web

## Verificação

A regra falha em voz alta no `pnpm lint`:

```
error  DR-001: não chame artaxnet.com direto. Use @hotel-paraiso/artax-client
       (rate limiter + circuit breaker + timeout)  no-restricted-syntax
```

Testada com arquivo-isca no momento da criação: a regra dispara, e passa a lintar limpo
quando o arquivo é removido.

## Referências

- [DR-001-artax-rate-limit.md](DR-001-artax-rate-limit.md)
- [INC-002](../incidents/INC-002-dr001-bypassada.md)
