# Permissões e MCPs

> Whitelist completa de ferramentas e APIs autorizadas. Claude Code consulta antes de cada operação.

## Princípio dos níveis

| Nível | Comportamento                           | Exemplos                                         |
| ----- | --------------------------------------- | ------------------------------------------------ |
| **1** | Uso livre, sem confirmação              | Ler/escrever arquivos do projeto, queries em dev |
| **2** | Uso livre dentro do contexto do projeto | Deploy em homologação, migrations em dev         |
| **3** | Uso livre para configuração inicial     | Criar contas em serviços, configurar tags        |
| **4** | **Sempre pede confirmação**             | Deletar produção, mudar DNS, publicar campanhas  |

## Nível 1 — Uso livre

### MCPs

- **Google Drive** — leitura e escrita de arquivos do projeto
- **Notion** — leitura e escrita na base do projeto
- **Gmail** — leitura para checar emails de verificação de contas criadas
- **Google Calendar** — leitura para contexto de prazos
- **GitHub** (via Claude Code) — branches, commits, PRs, issues

### APIs

- **Artax API** — todos os endpoints documentados em `/pms-api/v1/`
- **Localhost** — qualquer endpoint local
- **APIs internas do projeto** — qualquer

## Nível 2 — Infra do projeto

### Ferramentas

- **Docker local** — build, run, logs, exec
- **Postgres via Prisma** — migrations, queries, seeds (dev e prod)
- **Redis** — operações de cache e fila
- **Easypanel API** — deploy, restart de containers
- **Hostinger API** — leitura DNS, NÃO escrita
- **Cloudflare API** — leitura zona, NÃO escrita

### Permissões implícitas

- Criar branches e PRs
- Rodar testes em qualquer ambiente
- Deploy em homologação automático
- Rodar migrations em dev

## Nível 3 — Marketing e analytics

### MCPs ativos

- **Google Ads MCP** (já configurado) — criar/editar conversões, eventos, audiences (NÃO publicar campanhas pagas)
- **Meta MCP** — Custom Events, CAPI, audiences (NÃO publicar campanhas)

### APIs externas autorizadas

- **GA4 Measurement Protocol** — envio de eventos
- **Meta Conversions API** — envio de eventos
- **Google Tag Manager API** — CRUD tags, triggers, variáveis

### Operações pré-aprovadas

- Criar contas em: **GA4, Sentry, Resend, GTM**
- Criar/atualizar conversões em **Google Ads** e **Meta**
- Criar/atualizar audiências e custom events
- Gerar tokens de API e armazenar em `.env.local` (nunca commitado, nunca exposto em logs)
- Adicionar domínio a Cloudflare e configurar SSL

## Nível 4 — Sempre pede confirmação

### Operações destrutivas

- **DELETE** em qualquer tabela de produção
- Migrations destrutivas (drop column, drop table) em produção
- Forçar resync que apaga dados locais

### Operações de billing

- Upgrade de plano em qualquer serviço pago
- Criar campanhas pagas em Google Ads / Meta Ads (mesmo que configuração já esteja feita)
- Compras ou contratações

### Operações de DNS e domínio principal

- Mudanças em DNS do domínio em produção
- Mudanças em SSL/certificados de produção
- Redirects 301 permanentes

### Comunicação em massa

- Envio de email para >50 destinatários simultâneos
- Disparos de WhatsApp para hóspedes em massa

### Mudanças em código de produção sem PR

- Hotfixes direto em `main` (sempre via PR mesmo em emergência)

## Contas a serem criadas durante o projeto

| Serviço               | Plano         | Quem cria            | Status   |
| --------------------- | ------------- | -------------------- | -------- |
| GitHub (repo privado) | Free          | Moreira (login dele) | Fase 0.5 |
| Sentry                | Free → Team   | Claude via API       | Fase 0.5 |
| GA4                   | Free          | Claude via MCP       | Fase 0.5 |
| GTM                   | Free          | Claude via API       | Fase 0.5 |
| Google Ads            | Pré-existente | Moreira              | check    |
| Meta Business         | Pré-existente | Moreira              | check    |
| Resend                | Free          | Claude via API       | Fase 0.5 |
| Cloudflare            | Free          | Moreira              | Fase 0.5 |
| WhatsApp Cloud API    | Free          | Moreira              | Fase 6   |

## Armazenamento de credenciais

- **Nunca** commitar `.env*` (exceto `.env.example`)
- **Sempre** usar `dotenv-vault` ou Easypanel secrets em produção
- **Tokens locais** em `.env.local` (gitignored)
- **Documentação local** em `docs/credentials.md` (gitignored, só local)
- **Rotação** semestral para tokens de longa vida

## Auditoria

Toda ação em Nível 3 e 4 fica registrada em:

- `event_log` (Postgres) — quando relacionada a sistema
- `docs/decisions/` — quando arquitetural
- Git history — sempre
