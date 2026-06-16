# Regras Defensivas Ativas

> Índice de todas as regras defensivas derivadas de incidentes. Consultado em toda sessão do Claude Code.
>
> Cada regra tem documento próprio em `docs/defensive-rules/DR-XXX-{slug}.md` e teste em `docs/defensive-rules/tests/`.

## Status: nenhuma regra ativa ainda

O projeto está iniciando. Conforme incidentes surgirem e forem analisados, regras serão adicionadas aqui.

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
