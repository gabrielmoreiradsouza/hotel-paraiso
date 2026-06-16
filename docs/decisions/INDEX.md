# Índice de ADRs (Architecture Decision Records)

> Toda decisão arquitetural relevante é documentada como ADR. Consultado antes de mudanças arquiteturais.

## ADRs ativos

| #    | Título                                                  | Status    | Data       |
| ---- | ------------------------------------------------------- | --------- | ---------- |
| 0001 | Monorepo com Turborepo + pnpm                           | aceito    | 2026-06-15 |
| 0002 | Stack técnica (Next.js + Fastify + Prisma)              | aceito    | 2026-06-15 |
| 0003 | Conclusão Fase 0                                        | proposto  | 2026-06-15 |
| 0004 | Fastify vs Express vs Hono                              | planejado | —          |
| 0005 | Payload vs Sanity vs Strapi                             | planejado | —          |
| 0006 | Easypanel vs Vercel/Railway                             | planejado | —          |
| 0007 | GTM client-side no MVP (dual tracking preparando s-GTM) | planejado | —          |
| 0008 | CMS híbrido (operacional Artax + conteúdo Payload)      | planejado | —          |
| 0009 | Cloudflare como camada de proteção e CDN                | planejado | —          |
| 0010 | Sistema de aprendizado (3 artefatos por incidente)      | planejado | —          |

## Como criar novo ADR

1. Copiar `_TEMPLATE.md`
2. Numeração sequencial (próximo livre)
3. Slug em kebab-case
4. Status inicial: `proposto`
5. Após decisão: `aceito` | `rejeitado` | `superseded por ADR-XXX`
6. Adicionar entrada nesta lista
7. Se substituir ADR antigo, atualizar status do antigo

## Status possíveis

- **proposto** — em discussão
- **aceito** — em vigor
- **rejeitado** — descartado (mantém histórico)
- **superseded** — substituído por outro ADR mais recente
- **obsoleto** — ainda em vigor por compatibilidade, mas planejado para sair
