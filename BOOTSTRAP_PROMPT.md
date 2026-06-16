# PROMPT DE BOOTSTRAP — Primeira sessão Claude Code

Cole este texto na primeira sessão do Claude Code, após estar no diretório do projeto.

---

Você está iniciando o projeto **Hotel Paraíso**.

## Passo 1 — Carregar contexto

Leia, nesta ordem:

1. `CLAUDE.md` (raiz)
2. `docs/architecture/MASTER_BLUEPRINT.md`
3. `docs/architecture/PRINCIPLES.md`
4. `docs/architecture/STACK.md`
5. `docs/architecture/STRUCTURE.md`
6. `docs/architecture/ROADMAP.md`
7. `docs/architecture/PERMISSIONS.md`

Após ler, confirme em **3 linhas no máximo**:

- A missão do projeto
- A fase atual
- Os próximos 3 passos práticos

## Passo 2 — Executar Fase 0

Toda Fase 0 está descrita em `docs/architecture/ROADMAP.md` seção "Fase 0".

Critério de pronto:

- `pnpm install && pnpm dev` sobe stack local
- `pnpm lint && pnpm typecheck && pnpm test` passam
- CI verde no primeiro PR
- Hello world em `localhost:3000` e `localhost:3001/health`

Execute autonomamente, seguindo os padrões em `docs/architecture/CODE_STANDARDS.md`.

## Regras de execução

- Para Nível 1, 2 e 3 (ver `PERMISSIONS.md`): execute sem pedir confirmação
- Para Nível 4: sempre confirme
- Toda decisão arquitetural relevante → criar ADR em `docs/decisions/`
- Toda dificuldade resolvida → considerar se deve virar regra defensiva
- Reporte ao final de cada subetapa

## Ferramentas pré-aprovadas

Já listadas em `.claude/settings.local.json` e `docs/architecture/PERMISSIONS.md`.

## Comando inicial

Começe verificando o ambiente:

- `node --version` (deve ser 22.x+)
- `pnpm --version` (deve ser 9.x+)
- `docker info`
- `git --version`

Reporte em tabela ✅/❌ e prossiga para o bootstrap do monorepo.
