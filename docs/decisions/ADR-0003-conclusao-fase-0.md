# ADR-0003: Conclusão da Fase 0 — Fundação do repositório

**Data:** 2026-06-15  
**Status:** proposto  
**Autor:** Gabriel Moreira  
**Decisores:** Gabriel Moreira  
**Supersedes:** —

## Contexto

Fase 0 foca em bootstrap do repositório com todas as ferramentas configuradas e CI verde. É o pré-requisito para qualquer desenvolvimento funcional. Sem uma base sólida, fases posteriores acumulam dívida técnica desde o início.

## Decisão

Critérios de aceitação para considerar a Fase 0 concluída:

1. `pnpm install && pnpm dev` funciona sem erros
2. `pnpm lint && pnpm typecheck && pnpm test` passam
3. CI verde no primeiro PR
4. Hello world em `localhost:3000` (web/Next.js)
5. Health check em `localhost:3001/health` (api/Fastify)

Status será atualizado para **aceito** quando todos os critérios forem validados.

## Opções consideradas

### Opção A: Bootstrap mínimo (só apps, sem CI)

**Prós:**

- Mais rápido para começar a codar
  **Contras:**
- Sem CI, problemas acumulam silenciosamente
- Sem lint/typecheck, qualidade degrada desde o início

### Opção B: Bootstrap completo com validação (escolhido)

**Prós:**

- Base sólida desde o dia zero
- CI catch problemas antes de merge
- Lint e typecheck garantem padrão de código
- Health check valida que a API está funcional
  **Contras:**
- Investimento inicial maior em configuração

### Opção C: Bootstrap com deploy incluído

**Prós:**

- Validação end-to-end desde o início
  **Contras:**
- Deploy exige credenciais e infraestrutura (Fase 0.5)
- Escopo maior que o necessário para fundação

## Consequências

### Positivas

- Base sólida para Fase 0.5 (contas e credenciais) e Fase 1 (integração Artax)
- CI funcional impede regressões desde o primeiro PR
- Desenvolvedores podem clonar e rodar imediatamente

### Negativas

- Investimento de tempo em tooling antes de features visíveis

### Neutras

- Fase 0 não entrega valor ao usuário final, apenas fundação técnica

## Próximos passos

- [ ] Validar `pnpm install && pnpm dev`
- [ ] Validar `pnpm lint && pnpm typecheck && pnpm test`
- [ ] Primeiro PR com CI verde
- [ ] Confirmar hello world em localhost:3000
- [ ] Confirmar health check em localhost:3001/health
- [ ] Atualizar status para **aceito** após validação

## Referências

- ADR-0001 (monorepo com Turborepo)
- ADR-0002 (stack técnica)
- `docs/architecture/ROADMAP.md` — fases do projeto
