# ADR-0002: Stack técnica (Next.js 15 + Fastify 5 + Prisma 6)

**Data:** 2026-06-15  
**Status:** aceito  
**Autor:** Gabriel Moreira  
**Decisores:** Gabriel Moreira  
**Supersedes:** —

## Contexto

Escolha de stack para plataforma hoteleira com motor de reservas, integração com PMS Artax, tracking multi-plataforma. Requisitos: performance, tipagem forte, SSR, API rápida. O projeto precisa de uma stack moderna que permita desenvolvimento ágil com segurança de tipos end-to-end.

## Decisão

- **Next.js 15** (App Router, RSC, Turbopack) para frontend
- **Fastify 5** para API (mais rápido que Express, schema-based validation)
- **Prisma 6** para ORM (type-safe, migrations)
- **TypeScript 5** em todo o stack
- **Vitest** para testes
- **Tailwind CSS 4 + shadcn/ui** para UI

## Opções consideradas

### Opção A: Next.js + Express + TypeORM

**Prós:**

- Express tem ecossistema enorme e familiar
- TypeORM suporta Active Record e Data Mapper
  **Contras:**
- Express é significativamente mais lento que Fastify
- TypeORM tem tipagem menos robusta que Prisma
- Express não tem schema validation nativa

### Opção B: Next.js 15 + Fastify 5 + Prisma 6 (escolhido)

**Prós:**

- Fastify é ~2x mais rápido que Express em benchmarks
- Fastify tem schema-based validation nativa (JSON Schema / Typebox)
- Prisma gera tipos a partir do schema, garantindo type-safety no banco
- Next.js 15 com App Router e RSC reduz JS enviado ao cliente
- Tailwind CSS 4 com shadcn/ui permite customização total sem vendor lock-in
- Vitest é mais rápido que Jest e compatível com ESM
  **Contras:**
- Fastify requer aprendizado vs Express
- Prisma adiciona overhead de query engine
- shadcn/ui requer manutenção manual dos componentes copiados

### Opção C: Remix + Hono + Drizzle

**Prós:**

- Hono é ultraperformático e edge-ready
- Drizzle é mais leve que Prisma
- Remix tem bom modelo de data loading
  **Contras:**
- Ecossistema menor que Next.js
- Drizzle tem menos tooling (studio, migrations GUI)
- Remix está em transição para React Router v7

## Consequências

### Positivas

- Stack moderna e tipada end-to-end (TypeScript em todo lugar)
- Performance superior na API com Fastify
- Type-safety no banco com Prisma
- UI consistente e acessível com shadcn/ui
- Testes rápidos com Vitest

### Negativas

- Fastify requer aprendizado para quem vem de Express
- Prisma adiciona overhead de runtime (query engine)
- Manter componentes shadcn/ui copiados exige disciplina

### Neutras

- Next.js 15 App Router ainda está estabilizando algumas APIs
- Turbopack substitui Webpack mas ainda em evolução

## Próximos passos

- [x] Configurar Next.js 15 no workspace web
- [x] Configurar Fastify 5 no workspace api
- [ ] Configurar Prisma 6 com schema inicial
- [ ] Configurar Vitest com cobertura
- [ ] Setup shadcn/ui com design tokens

## Referências

- [Next.js 15 docs](https://nextjs.org/docs)
- [Fastify 5 docs](https://fastify.dev/docs/latest/)
- [Prisma 6 docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev)
- ADR-0001 (monorepo)
- ADR-0004 (Fastify vs Express vs Hono — detalhamento)
