# /check-perf

Validar Core Web Vitals contra alvo.

Executar:

1. Build de produção: `pnpm build`
2. Servir local: `pnpm start`
3. Rodar Lighthouse CI contra páginas principais
4. Comparar com baseline em `docs/architecture/SLAS.md`
5. Reportar regressões
