# /run-tests

Rodar suite completa de testes.

Executar em ordem:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (unit + integration)
4. `pnpm test:e2e` (Playwright)
5. Reportar resultado consolidado
