# Sistema de Aprendizado Contínuo

## Filosofia

Cada erro analisado deve **fortalecer o sistema** além do caso específico. Bug pontual vira regra defensiva genérica que protege a classe inteira de problemas análogos.

> "Um erro analisado é um erro que nunca mais acontece — nem ele, nem seus primos."

## Os 3 artefatos obrigatórios por incidente

Toda vez que um incidente é resolvido, você (humano + Claude) produz:

### 1. Root cause

A causa específica do problema. Não confundir com sintoma.

- Sintoma: "API retornou 500"
- Root cause: "ArtaxClient não validou timezone na comparação de datas, causando overbooking em transição DST"

### 2. Defensive rule

Regra genérica que protege casos análogos. Vai para `docs/defensive-rules/ACTIVE.md`.

- "Toda comparação de datas no sistema usa `compareDatesInTimezone(a, b, 'America/Sao_Paulo')`"
- Implementada em código + lint rule customizada + teste

### 3. Test case

Teste automatizado que captura essa classe de problema.

- Vitest unit ou Playwright E2E
- Roda em CI, falha se a regressão ocorrer
- Vinculado ao incidente no nome do arquivo

## Estrutura de dados

```
docs/
├── incidents/
│   ├── _TEMPLATE.md
│   ├── INC-001-timezone-double-booking.md
│   ├── INC-002-webhook-replay-attack.md
│   └── ...
├── defensive-rules/
│   ├── ACTIVE.md          ← índice (lido em todas as sessões)
│   ├── DR-001-date-comparison.md
│   ├── DR-002-webhook-signature.md
│   └── tests/             ← testes correspondentes
└── experiments/
    ├── EXP-001-button-color.md
    └── ...
```

## Coleta automática

| Origem                | Destino                 | Quando                                   |
| --------------------- | ----------------------- | ---------------------------------------- |
| Erros Sentry          | `Incident` table        | Em tempo real, agrupados por fingerprint |
| Eventos usuário       | `AnalyticsEvent`        | Em tempo real                            |
| Divergências sync     | `SyncJob.errorDetails`  | A cada job                               |
| Regressão performance | `PerformanceRegression` | A cada deploy                            |
| Mudanças código       | `change_log` (git + db) | A cada commit                            |

## Detecção de anomalias

Job semanal cruza métricas atuais vs baseline:

| Métrica                | Threshold         |
| ---------------------- | ----------------- |
| Taxa de conversão      | ±2 desvios padrão |
| Tempo médio de busca   | ±2 desvios        |
| Erro rate por endpoint | >0.5% absoluto    |
| LCP por página         | >1.5x baseline    |
| Webhook delay          | >30s              |

Anomalia detectada → alerta Slack + entrada `Incident` com tag `anomaly`.

## Aplicação proativa: o CI step `learn-check`

Antes de cada PR, `scripts/learn-check.ts` executa:

1. Lista arquivos modificados
2. Para cada arquivo, identifica regras defensivas relacionadas (`docs/defensive-rules/ACTIVE.md`)
3. Para cada regra, verifica padrão de uso correto
4. Se violar, falha o build com mensagem específica:

```
❌ DR-001 violated in apps/api/src/domain/booking/BookingService.ts:42
   Date comparison without timezone-safe helper.
   Use: compareDatesInTimezone(a, b, 'America/Sao_Paulo')
   See: docs/defensive-rules/DR-001-date-comparison.md
```

## Aplicação proativa: contexto do Claude

`docs/defensive-rules/ACTIVE.md` é referenciado no `CLAUDE.md`. Toda sessão do Claude Code carrega o índice de regras ativas e respeita ao codar.

## Dashboards de aprendizado

No admin (Fase 5):

- **Incidentes por classe** — quais áreas geram mais bugs
- **Regras defensivas mais violadas** — quais áreas precisam de mais atenção
- **MTTR (mean time to recovery)** — quanto tempo de detecção até resolução
- **Repetições por classe** — incidentes similares se repetindo (sinal de regra fraca)
- **Score de blindagem** — % de incidentes que geraram regra defensiva ativa

## Templates

`docs/incidents/_TEMPLATE.md` e `docs/decisions/_TEMPLATE.md` ditam formato. Slash commands `/new-incident` e `/new-adr` os usam.

## Revisão periódica

- **Mensal**: revisar incidentes do mês, identificar padrões
- **Trimestral**: revisar todas as regras defensivas (algumas viram obsoletas)
- **Anual**: revisar arquitetura à luz do aprendido

## Exemplos de incidentes hipotéticos (para ilustrar formato)

### Caso 1: Timezone

- **INC-001-timezone-double-booking**
- Root cause: comparação `new Date(a) > new Date(b)` ignora timezone
- Defensive rule DR-001: usar `compareDatesInTimezone` centralizado
- Test: criar booking em transição DST, esperar erro previsto
- ESLint custom rule: proibe `new Date(string)` exceto em código de teste

### Caso 2: Webhook duplicado

- **INC-002-webhook-replay-attack**
- Root cause: webhook processado duas vezes (rede instável Artax)
- Defensive rule DR-002: toda mensagem de webhook tem natural key + check de idempotência
- Test: enviar mesma mensagem 5x, esperar 1 efeito
- Migration: adicionar índice unique em `WebhookDelivery(source, eventType, payload_hash)`

### Caso 3: SQL injection (preventivo)

- **INC-003-prisma-raw-query-vulnerability**
- Root cause: `prisma.$queryRaw` com interpolação de string
- Defensive rule DR-003: proibir `$queryRaw` exceto em scripts admin, usar `$queryRawUnsafe` nunca
- Test: tentativa de injection deve ser bloqueada por validação Zod prévia
- ESLint custom rule: avisa em uso de `$queryRaw` exigindo comentário com justificativa
