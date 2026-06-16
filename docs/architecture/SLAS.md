# SLAs e Métricas

## Performance (Core Web Vitals)

| Métrica                         | Alvo   | Crítico | Validação            |
| ------------------------------- | ------ | ------- | -------------------- |
| LCP (Largest Contentful Paint)  | <1.5s  | <2.5s   | Lighthouse CI por PR |
| INP (Interaction to Next Paint) | <100ms | <200ms  | Lighthouse CI + RUM  |
| CLS (Cumulative Layout Shift)   | <0.05  | <0.1    | Lighthouse CI        |
| FCP (First Contentful Paint)    | <1.0s  | <1.8s   | Lighthouse CI        |
| TTFB (Time to First Byte)       | <300ms | <600ms  | Server-side          |

## Backend

| Métrica               | Alvo      | Crítico |
| --------------------- | --------- | ------- |
| API latência p50      | <100ms    | <200ms  |
| API latência p95      | <300ms    | <800ms  |
| API latência p99      | <800ms    | <2s     |
| Error rate            | <0.1%     | <1%     |
| Throughput sustentado | 100 req/s | —       |

## Disponibilidade

| Métrica                      | Alvo   | Crítico |
| ---------------------------- | ------ | ------- |
| Uptime mensal                | 99.5%  | 99%     |
| MTTR (mean time to recovery) | <30min | <2h     |
| MTTD (mean time to detect)   | <5min  | <30min  |
| Frequência de incidentes     | <2/mês | <5/mês  |

## Sincronização Artax

| Métrica                        | Alvo   | Crítico |
| ------------------------------ | ------ | ------- |
| Drift de reservas              | 0      | <2/dia  |
| Tempo webhook → banco          | <5s    | <30s    |
| Reconciliação diária completa  | <5min  | <15min  |
| Taxa de webhooks bem-sucedidos | >99.9% | >99%    |

## Conversão (benchmark interno)

| Estágio                        | Conversão esperada |
| ------------------------------ | ------------------ |
| Visita → search                | 50%                |
| Search → availability_viewed   | 85%                |
| Availability → room_selected   | 24%                |
| Room → checkout_started        | 40%                |
| Checkout → reservation_created | 44%                |
| **Geral (visita → reserva)**   | **3.5%**           |

Métricas acompanhadas no painel admin (Fase 5). Desvios >2σ geram alerta.

## Aprendizado

| Métrica                                | Alvo                |
| -------------------------------------- | ------------------- |
| Incidentes que geram defensive rule    | >80%                |
| Defensive rules com teste automatizado | 100%                |
| Incidentes repetidos da mesma classe   | <5%                 |
| Tempo médio de criação de post-mortem  | <48h após resolução |

## Monitoramento

### Alertas Slack/WhatsApp imediatos

- Sentry: erro novo de classe crítica
- Artax down >2min
- API p95 >1s sustentado por 5min
- Error rate >1% por 5min
- Webhook delay >1min

### Alertas diários (resumo)

- Incidentes do dia
- Reservas vs baseline
- Performance dia anterior

### Dashboards permanentes

- Status do sistema (uptime, latência, errors)
- Funil de conversão (tempo real)
- Sincronização Artax (drift, last sync)
- Aprendizado (incidentes ativos, regras violadas)
