# Tracking e Funil de Conversão

## Filosofia

**Dual tracking desde o dia 1**: cliente (GTM/dataLayer) + servidor (GA4 Measurement Protocol + Meta Conversions API). Toda jornada persistida em `analytics_events` no Postgres, fonte da verdade para análise interna.

## Eventos canônicos

### Macro (key events em GA4/Ads/Meta)

| #   | Evento                | Disparado quando                        |
| --- | --------------------- | --------------------------------------- |
| 1   | `search_performed`    | Usuário fez busca de disponibilidade    |
| 2   | `availability_viewed` | Viu resultados de quartos disponíveis   |
| 3   | `room_selected`       | Selecionou um quarto específico         |
| 4   | `checkout_started`    | Começou a preencher dados               |
| 5   | `reservation_created` | **CONVERSÃO** — reserva criada no Artax |

### Micro (suporte à análise de UX)

| Evento                  | Disparado quando                                 |
| ----------------------- | ------------------------------------------------ |
| `page_view`             | Mudança de rota                                  |
| `room_card_viewed`      | Quarto entrou no viewport (IntersectionObserver) |
| `gallery_opened`        | Abriu galeria de fotos                           |
| `dates_changed`         | Alterou datas no seletor                         |
| `guests_changed`        | Alterou nº de hóspedes                           |
| `language_changed`      | Trocou idioma pt↔en                              |
| `whatsapp_clicked`      | Clicou botão WhatsApp                            |
| `form_field_focused`    | Entrou em campo do checkout                      |
| `form_validation_error` | Erro de validação no checkout                    |
| `back_button_clicked`   | Voltou no fluxo                                  |
| `session_quality_high`  | Sessão >2min ou 3+ páginas                       |

## Contexto de cada evento

Todo evento carrega:

```typescript
{
  session_id: string,        // cuid da sessão
  user_pseudo_id: string,    // GA4-compatible
  utm_source?: string,
  utm_medium?: string,
  utm_campaign?: string,
  utm_term?: string,
  utm_content?: string,
  gclid?: string,
  fbclid?: string,
  referrer?: string,
  device: 'mobile' | 'tablet' | 'desktop',
  page_url: string,
  timestamp_ms: number,
  value?: number,            // em BRL (potencial mesmo sem cobrança)
  payload: Record<string, unknown>  // específico do evento
}
```

## Mapeamento para plataformas

| Evento interno        | GA4       | Google Ads                  | Meta Ads         |
| --------------------- | --------- | --------------------------- | ---------------- |
| `reservation_created` | key event | Conversion (Purchase)       | Purchase         |
| `checkout_started`    | key event | Conversion (Begin Checkout) | InitiateCheckout |
| `room_selected`       | event     | —                           | ViewContent      |
| `search_performed`    | event     | —                           | Search           |
| `availability_viewed` | event     | —                           | —                |
| Outros micro          | event     | —                           | —                |

## Arquitetura técnica

### Client-side (GTM + dataLayer)

```javascript
// packages/tracking/client.ts
window.dataLayer.push({
  event: 'reservation_created',
  session_id: '...',
  value: 1850.0,
  currency: 'BRL',
  booking_id: 12345,
  // ...
});
```

GTM dispara em paralelo para GA4, Google Ads, Meta Pixel.

### Server-side (paralelo)

Toda criação de reserva no backend também dispara:

1. **GA4 Measurement Protocol** — `POST /mp/collect`
2. **Meta Conversions API** — `POST /events`
3. **Persistência** — `INSERT INTO analytics_events`

Isso garante: (a) não perde eventos de ad-blockers, (b) atribui dados que só o servidor tem (CPF hasheado, ip, user-agent oficial), (c) prepara migração para s-GTM no v2.

### Deduplicação

- Cada evento tem `event_id` único (uuid)
- GA4 e Meta deduplicam por `event_id` quando recebem cliente e servidor
- Evita contagem dupla

## Atribuição

UTMs e click IDs capturados na **primeira visita da sessão** e persistidos em `Session`. Atribuição **first-touch** por padrão (configurável para last-touch ou linear no admin).

### Multi-sessão (cross-device)

- Hash de email (quando disponível) como `user_id` GA4
- Permite atribuição correta quando usuário pesquisa no mobile e converte no desktop

## Eventos de conversão para Ads

### Google Ads

- Conversões enhanced (envia email/telefone hasheados para matching)
- Conversion actions: `Purchase` (reserva), `Begin Checkout`
- Valor real da reserva como `value`
- `gclid` capturado e enviado

### Meta Ads

- Pixel + Conversions API (deduplicação por event_id)
- Eventos padrão: `Purchase`, `InitiateCheckout`, `ViewContent`, `Search`
- Advanced Matching com email/phone/document hasheados
- `fbclid` capturado

## Funil esperado (referência)

```
1000 search_performed
  → 850 availability_viewed (85%)
    → 200 room_selected (24%)
      → 80 checkout_started (40%)
        → 35 reservation_created (44%)
```

Conversão geral: 3.5% (search → reserva). Métrica acompanhada no admin.

## Privacidade

- Consentimento via banner (LGPD)
- Sem consentimento: apenas eventos essenciais técnicos (1ª festa)
- Com consentimento: tracking completo
- Direito ao esquecimento: endpoint `/privacy/delete` apaga dados pessoais
