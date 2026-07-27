# Regras Defensivas Ativas

> Índice de todas as regras defensivas derivadas de incidentes. Consultado em toda sessão do Claude Code.
>
> Cada regra tem documento próprio em `docs/defensive-rules/DR-XXX-{slug}.md` e teste em `docs/defensive-rules/tests/`.

## Regras ativas

### DR-001: Proteção contra rate limit destrutivo da Artax

**Origem:** Incidente 2026-06-18 (chave API desabilitada)
**Status:** ativa
**Categoria:** infrastructure
**Resumo:** Rate limiter interno em 50 req/min (real = 100, fatal = 102). Nunca testar em loop contra API real.
**Implementação:** `packages/artax-client/src/utils/rate-limiter.ts`
**Documento:** [DR-001-artax-rate-limit.md](DR-001-artax-rate-limit.md)

## Formato de entrada (template)

```markdown
### DR-XXX: [Título curto]

**Origem:** INC-XXX  
**Status:** ativa | obsoleta  
**Categoria:** validation | security | performance | data | infrastructure  
**Resumo:** [1 linha do que protege]  
**Implementação:** [arquivo principal]  
**Teste:** [arquivo de teste]  
**Documento:** [link para DR-XXX-*.md]
```

## Categorias previstas

- **validation** — validação de input, sanitização
- **security** — auth, autorização, criptografia, injection
- **performance** — caching, otimização, queries
- **data** — integridade, consistência, idempotência
- **infrastructure** — deploy, configuração, secrets

## Como adicionar uma nova regra

1. Resolver o incidente
2. Criar `docs/incidents/INC-XXX-{slug}.md`
3. Identificar a generalização → criar `docs/defensive-rules/DR-XXX-{slug}.md`
4. Implementar a regra no código + ESLint rule se aplicável
5. Criar teste em `docs/defensive-rules/tests/DR-XXX.test.ts`
6. Adicionar entrada nesta lista
7. Atualizar `CLAUDE.md` se for crítica
