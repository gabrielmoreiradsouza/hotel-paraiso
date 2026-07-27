# DR-001: Proteção contra rate limit destrutivo da Artax

**Origem:** Incidente 2026-06-18 — chave API desabilitada por excesso de requests em testes
**Status:** ativa
**Categoria:** infrastructure
**Resumo:** Artax desabilita a chave API permanentemente ao atingir 102 requests em 60 segundos. Sem recuperação automática — requer contato com suporte.

## Regra

1. **Rate limiter interno no ArtaxClient:** máximo 50 requests por 60 segundos (metade do limite real)
2. **NUNCA testar endpoints em loop** contra a API real. Usar MSW mocks para desenvolvimento e testes automatizados
3. **Máximo 3 requests manuais** por sessão de teste contra API real, com 2 segundos de intervalo entre cada
4. **Cache de disponibilidade:** resultados cacheados por 5 minutos para evitar requests repetidos
5. **Circuit breaker:** após 3 falhas consecutivas, parar de chamar a API por 30 segundos

## Contexto

- Limite real: 100 req/60s (warning), 102 req/60s (chave desabilitada)
- Desabilitação é PERMANENTE — precisa contato com suporte Artax para reativar
- A chave foi desabilitada em 2026-06-18 durante testes de endpoint

## Implementação

- `packages/artax-client/src/utils/rate-limiter.ts` — maxRequests = 50
- `packages/artax-client/src/utils/circuit-breaker.ts` — failureThreshold = 5, resetTimeout = 30s
- `apps/web/src/app/api/bookings/route.ts` — fallback local quando Artax falha

## Teste

- Unit test verifica que rate limiter bloqueia acima de 50 req/min
- CI roda contra MSW mocks, nunca contra API real
