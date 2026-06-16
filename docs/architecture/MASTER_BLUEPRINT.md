# MASTER BLUEPRINT — Hotel Paraíso

**Versão:** 1.0 · **Última atualização:** 2026-06-15 · **Status:** Aprovado

> Documento mestre do projeto. Toda decisão arquitetural relevante referencia este blueprint. Atualizações requerem ADR.

## 1. Visão

Plataforma digital integrada que **aprende continuamente**. Cada interação (usuário, sistema, erro, sucesso) alimenta uma base de conhecimento que torna o sistema progressivamente mais robusto, mais convertedor e mais seguro.

O motor de reservas é o **primeiro produto** desta plataforma. Outros virão (área do hóspede, fidelidade, eventos, etc.).

## 2. Componentes do sistema

| Componente          | Tecnologia                     | Responsabilidade                                         |
| ------------------- | ------------------------------ | -------------------------------------------------------- |
| Frontend público    | Next.js 15                     | Site institucional + motor de reservas + tracking client |
| API Gateway         | Fastify 5                      | Validação, rate limit, auth, roteamento                  |
| Serviços de domínio | TypeScript puro                | Lógica de negócio testável                               |
| ArtaxClient         | TypeScript + axios             | Wrapper Artax com circuit breaker, retry, rate limit     |
| Banco operacional   | PostgreSQL 16                  | Espelho Artax + jornada + sistema                        |
| Cache e filas       | Redis 7 + BullMQ               | Jobs assíncronos, cache, sessões                         |
| CMS                 | Payload 3                      | Conteúdo rico bilíngue                                   |
| Admin               | Next.js 15 + NextAuth 5        | Painel operacional                                       |
| Workers             | BullMQ                         | Sync, webhooks, reconciliação, anomalias                 |
| Tracking server     | Custom + GA4 MP + Meta CAPI    | Eventos server-side                                      |
| Observabilidade     | Sentry + Grafana + Loki        | Logs, métricas, traces, alertas                          |
| Comunicação         | Resend + WhatsApp Cloud        | Emails e notificações                                    |
| Infra               | Easypanel + Caddy + Cloudflare | Deploy, SSL, CDN, WAF                                    |

## 3. Arquitetura em camadas

Ver diagrama em `docs/architecture/diagrams/layers.md`.

```
1. Apresentação (Next.js)
   ↕
2. API Gateway (Fastify)
   ↕
3. Serviços de domínio
   ↕              ↕
4A. Integração   4B. Dados
   ↕              ↕
5. Jobs/Filas    6. Eventos (event_log)
   ↕
Externos: Artax, Resend, WhatsApp, GA4, Ads, Meta
```

## 4. Documentos detalhados

### Arquitetura

| Tópico                  | Documento                         |
| ----------------------- | --------------------------------- |
| Princípios fundamentais | `architecture/PRINCIPLES.md`      |
| Stack e versões         | `architecture/STACK.md`           |
| Estrutura do monorepo   | `architecture/STRUCTURE.md`       |
| Modelo de dados         | `architecture/DATA_MODEL.md`      |
| Tracking e eventos      | `architecture/TRACKING.md`        |
| Padrões de código       | `architecture/CODE_STANDARDS.md`  |
| MCPs e permissões       | `architecture/PERMISSIONS.md`     |
| Roadmap e fases         | `architecture/ROADMAP.md`         |
| Proteção de IP          | `architecture/IP_PROTECTION.md`   |
| Sistema de aprendizado  | `architecture/LEARNING_SYSTEM.md` |
| SLAs e métricas         | `architecture/SLAS.md`            |

### Design e UX

| Tópico                          | Documento                      |
| ------------------------------- | ------------------------------ |
| Sistema de design (visão geral) | `design/DESIGN_SYSTEM.md`      |
| Design tokens                   | `design/DESIGN_TOKENS.md`      |
| Componentes                     | `design/COMPONENTS.md`         |
| Padrões de UI                   | `design/UI_PATTERNS.md`        |
| Animações e motion              | `design/MOTION.md`             |
| Motor de reservas (UX)          | `design/BOOKING_FLOW.md`       |
| Padrões do admin                | `design/ADMIN_PATTERNS.md`     |
| Responsividade                  | `design/RESPONSIVE.md`         |
| Acessibilidade                  | `design/ACCESSIBILITY.md`      |
| Imagens e mídia                 | `design/MEDIA.md`              |
| Referências validadas           | `design/REFERENCES.md`         |
| **Pendências do cliente**       | `design/references/PENDING.md` |

## 5. Governança

- Toda mudança arquitetural requer **ADR** em `docs/decisions/`
- Todo incidente vira **INC-X** em `docs/incidents/`
- Toda regra defensiva tem **teste automatizado** em `docs/defensive-rules/`
- CHANGELOG.md mantido por release
- Revisão mensal de incidentes (mesmo solo)

## 6. Status atual

**Fase 0** — Fundação do repositório. Ver `ROADMAP.md` para detalhes da fase corrente e próximas.

## 7. Referências externas

- API Artax: `https://artaxnet.com/developer/documentation`
- Suporte Artax: `helpdesk@artaxnet.com.br` · `+55 21 99988-0721`
