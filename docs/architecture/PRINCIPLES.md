# Princípios Fundamentais

> Os 7 princípios não-negociáveis do projeto. Toda decisão técnica deriva destes.

## 1. Aprendizado sistêmico

Cada erro analisado gera 3 artefatos obrigatórios:

- **Root cause** — causa específica do problema
- **Defensive rule** — regra genérica que protege casos análogos
- **Test case** — teste automatizado capturando essa classe

Documentação obrigatória em `docs/incidents/INC-{n}-{slug}.md`. Ver `LEARNING_SYSTEM.md`.

## 2. Source of Truth bem definido

| Domínio                                         | Fonte da verdade   |
| ----------------------------------------------- | ------------------ |
| Operacional (reservas, disponibilidade, preços) | **Artax**          |
| Conteúdo (fotos, descrições, blog)              | **Payload CMS**    |
| Analytics, jornada, histórico                   | **Postgres local** |

Nunca duplicar autoridade. Banco local é cache + histórico, não substitui Artax.

## 3. Idempotência por padrão

Toda operação que muda estado deve ser segura para reexecução:

- Chave de idempotência em requisições críticas
- Natural keys quando possível
- Webhooks duplicados não causam efeitos colaterais
- Reconciliação não cria duplicatas

## 4. Event-driven internamente

Toda mudança de estado relevante gera evento auditável em `event_log` (append-only).

Permite:

- Auditoria completa
- Replay para debug
- Source para analytics
- Source para sistema de aprendizado

## 5. Fail loud, recover gracefully

Erros são:

- Logados com contexto rico (Pino estruturado)
- Reportados ao Sentry
- Alertados quando críticos (Slack/WhatsApp)

Sistema continua operando em **modo degradado** quando possível:

- Artax fora? Salva intenção, processa quando volta
- Tracking server fora? Cliente ainda envia
- Cache fora? Vai direto no Postgres

## 6. Performance como feature

| Métrica | Alvo   | Crítico |
| ------- | ------ | ------- |
| LCP     | <1.5s  | <2.5s   |
| INP     | <100ms | <200ms  |
| CLS     | <0.05  | <0.1    |
| API p95 | <300ms | <800ms  |

Validado em CI a cada PR via Lighthouse CI. Ver `SLAS.md`.

## 7. Privacidade e proteção de IP

- Dados sensíveis criptografados em repouso (CPF, documento, telefone)
- Lógica de negócio sempre no backend
- Frontend protegido contra cópia oportunista (ver `IP_PROTECTION.md`)
- LGPD compliance: consentimento, direito ao esquecimento, portabilidade
