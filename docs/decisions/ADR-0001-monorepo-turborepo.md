# ADR-0001: Monorepo com Turborepo + pnpm

**Data:** 2026-06-15  
**Status:** aceito  
**Autor:** Gabriel Moreira  
**Decisores:** Gabriel Moreira  
**Supersedes:** —

## Contexto

Projeto Hotel Paraíso precisa de múltiplas aplicações (web, api, admin, cms, workers) e packages compartilhados. A estrutura precisa suportar desenvolvimento paralelo, builds eficientes e compartilhamento de código tipado entre apps. Opções avaliadas: polyrepo, Nx, Turborepo, Lerna.

## Decisão

Adotar Turborepo + pnpm workspaces como estratégia de monorepo. Turborepo é leve, focado em build caching e task parallelization. pnpm é o package manager mais eficiente em disco e resolução de dependências.

## Opções consideradas

### Opção A: Polyrepo

**Prós:**

- Independência total entre repositórios
- CI isolado por projeto
  **Contras:**
- Dificuldade de compartilhar código tipado
- Versionamento manual entre packages
- Duplicação de configuração (ESLint, TypeScript, etc.)

### Opção B: Nx

**Prós:**

- Ecossistema completo (generators, executors, dependency graph)
- Build caching local e remoto
- Suporte a múltiplas linguagens
  **Contras:**
- Complexidade elevada para o tamanho do projeto
- Curva de aprendizado maior
- Overhead de configuração

### Opção C: Turborepo + pnpm (escolhido)

**Prós:**

- Leve e simples de configurar
- Build caching eficiente (local e remote via Vercel)
- Task parallelization nativa
- pnpm resolve dependências de forma eficiente (hard links, content-addressable store)
  **Contras:**
- Sem generators nativos (compensado por templates manuais)
- Menos features que Nx para projetos muito grandes

### Opção D: Lerna

**Prós:**

- Maduro e bem documentado
  **Contras:**
- Projeto teve período de estagnação
- Menos eficiente que Turborepo em caching
- Atualmente mantido pela Nx (dependência indireta)

## Consequências

### Positivas

- Build cache compartilhado entre apps e packages
- Tasks paralelas reduzem tempo de CI
- Dependency hoisting controlado pelo pnpm
- Configuração mínima para começar

### Negativas

- Sem generators nativos — templates precisam ser mantidos manualmente
- Remote caching depende de Vercel ou configuração custom

### Neutras

- Estrutura de workspaces requer disciplina na organização de packages

## Próximos passos

- [x] Inicializar repositório com Turborepo
- [x] Configurar pnpm workspaces
- [ ] Configurar remote caching
- [ ] Documentar convenções de packages

## Referências

- [Turborepo docs](https://turbo.build/repo/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
- ADR-0002 (stack técnica)
