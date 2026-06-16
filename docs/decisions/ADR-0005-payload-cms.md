# ADR-0005: Payload CMS 3 como CMS do projeto

**Data:** 2026-06-16  
**Status:** aceito  
**Autor:** Gabriel Moreira  
**Decisores:** Gabriel Moreira  
**Supersedes:** —

## Contexto

O projeto precisa de um CMS para gerenciar conteudo rico bilingue: quartos, experiencias, galeria, blog e paginas institucionais. O conteudo precisa suportar i18n (pt/en) nativamente e ser editavel por nao-desenvolvedores. Tres opcoes foram avaliadas: Payload CMS 3 (self-hosted, Postgres, React admin), Sanity (SaaS, GROQ) e Strapi (self-hosted, REST/GraphQL).

## Decisao

Adotar **Payload CMS 3** self-hosted. Usa o mesmo Postgres do operacional (schema separado). Admin em React nativo. Suporta i18n nativo. Roda como app Next.js integrado. Lexical como rich text editor.

## Opcoes consideradas

### Opcao A: Payload CMS 3 (self-hosted)

**Pros:**

- Self-hosted, sem vendor lock-in
- Usa Postgres (mesmo banco do operacional, schema separado)
- Admin UI em React nativo — extensivel com componentes proprios
- i18n built-in com suporte a locales
- Roda como app Next.js (mesma stack do projeto)
- TypeScript nativo, tipagem end-to-end
- Lexical editor (moderno, extensivel)

**Contras:**

- Mais complexo para content editors do que Sanity
- Precisa manter infra (servidor, banco, deploy)
- Ecossistema de plugins menor que Strapi

### Opcao B: Sanity (SaaS)

**Pros:**

- Excelente DX para content editors
- GROQ como query language poderosa
- CDN global, real-time collaboration
- Generous free tier

**Contras:**

- SaaS — vendor lock-in
- Banco separado (nao Postgres)
- Custo escala com uso
- Dados fora do nosso controle

### Opcao C: Strapi (self-hosted)

**Pros:**

- Self-hosted, open-source
- Grande ecossistema de plugins
- REST e GraphQL nativos
- Comunidade ativa

**Contras:**

- Stack propria (nao integra como Next.js)
- Admin UI menos flexivel
- Migracao de v4 para v5 recente, ecossistema fragmentado
- Nao usa React nativo no admin

## Consequencias

### Positivas

- Mesmo banco Postgres (simplicidade operacional, backup unificado)
- Self-hosted (controle total, sem vendor lock-in)
- Tipagem TypeScript nativa (type-safe end-to-end)
- i18n built-in (pt/en sem gambiarras)
- Controle total do admin UI (React nativo, extensivel)
- Lexical editor moderno e extensivel

### Negativas

- Mais complexo que Sanity para content editors nao-tecnicos
- Precisa manter infra propria (deploy, monitoramento, backups)
- Ecossistema de plugins menor que Strapi

### Neutras

- Requer schema separado no Postgres para isolamento do operacional
- Lexical ainda amadurecendo vs editores mais estabelecidos

## Proximos passos

- [ ] Instalar Payload CMS 3 em `apps/cms`
- [ ] Criar colecoes iniciais (Rooms, Experiences, Gallery, Pages, Blog)
- [ ] Configurar i18n com locales pt-BR e en
- [ ] Configurar schema separado no Postgres
- [ ] Integrar admin UI com design system do projeto

## Referencias

- [Payload CMS 3 docs](https://payloadcms.com/docs)
- [Payload CMS GitHub](https://github.com/payloadcms/payload)
- ADR-0002 (Stack tecnica)
- ADR-0008 (CMS hibrido operacional + conteudo)
