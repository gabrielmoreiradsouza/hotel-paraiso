# Testes de carga — Hotel Paraíso

Suíte k6 para validar o sistema antes de jogar tráfego pago.

## ⛔ Regra inviolável: nunca testar carga em `POST /api/bookings`

`POST /api/bookings` **não é idempotente e tem efeito colateral externo irreversível**:

1. Cria reserva real na Artax PMS (`/booking/create`)
2. Dispara WhatsApp real via Evolution API para o hóspede **e para o hotel** (`553138818049`)
3. Envia e-mail real via Resend
4. Dispara conversão real para GA4 Measurement Protocol e Meta CAPI

Um teste de carga de 80 VUs nesse endpoint geraria centenas de reservas fantasma no PMS,
centenas de WhatsApps no celular do hotel e envenenaria os dados de conversão do Google Ads
usados para otimização de campanha.

Nenhum script desta pasta chama esse endpoint. Se for necessário validar o caminho de escrita,
faça com **um** request manual contra staging com credenciais Artax de sandbox.

> Nota relacionada: `e2e/booking-flow.spec.ts` tem o teste `full booking flow creates real
reservation`, que **cria reserva real a cada execução de CI**. Ver auditoria.

## Scripts

| Script                 | O que faz                                                        | Onde rodar      |
| ---------------------- | ---------------------------------------------------------------- | --------------- |
| `availability-load.js` | Caminho crítico do funil sob rampa até 80 VUs. Só leitura.       | staging / prod  |
| `abuse-probe.js`       | Prova os vetores de abuso da auditoria (flood de eventos, spoof) | staging / local |

## Uso

```bash
# Local (app rodando em :3000)
k6 run perf/availability-load.js

# Staging
BASE_URL=https://staging.hotelparaiso.moreirads.cloud k6 run perf/availability-load.js

# Produção — só depois dos fixes CRÍTICOS da auditoria
BASE_URL=https://hotelparaiso.moreirads.cloud k6 run perf/availability-load.js
```

`abuse-probe.js` **não deve rodar contra produção**: ele injeta eventos `reservation_created`
falsos no store de analytics, corrompendo o funil real.

## SLOs definidos

| Métrica                        | Alvo         | Porquê                                        |
| ------------------------------ | ------------ | --------------------------------------------- |
| `availability_latency` p95     | < 2000ms     | Acima disso o usuário abandona a busca        |
| `availability_latency` p99     | < 4000ms     | Cauda longa = dependência da Artax degradando |
| `availability_errors`          | < 1%         | Erro na busca = clique pago perdido           |
| `http_req_duration{page:home}` | p95 < 1500ms | LCP da landing de campanha                    |

A métrica `artax_upstream_degraded` isola os 502 — quando ela sobe, o limite é do
fornecedor (Artax), não da aplicação. Distinguir os dois é o que evita otimizar o lado errado.
