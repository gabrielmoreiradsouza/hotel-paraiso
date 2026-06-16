# Artax PMS API v1.0

Base URL: `https://artaxnet.com/pms-api/v1/`

## Authentication

- Headers: `ClientId` and `ClientSecret` on every request
- Also `Accept: application/json`

## Rate Limits

- 100 requests per 60 seconds (warning)
- 102 requests per 60 seconds → API key disabled

## Booking Statuses

| Status      | Code |
| ----------- | ---- |
| Pré Reserva | 1    |
| Confirmado  | 2    |
| Hospedado   | 3    |
| Check-out   | 4    |
| Cancelado   | 5    |
| No Show     | 6    |

## Endpoints

### Reservas

| Method | Endpoint                     | Description                                              |
| ------ | ---------------------------- | -------------------------------------------------------- |
| GET    | `/bookings`                  | Listar reservas (paginado, com filtros)                  |
| GET    | `/bookings/{id}`             | Retornar reserva pelo ID                                 |
| GET    | `/availability`              | Verificar disponibilidade de quartos                     |
| POST   | `/bookings`                  | Criar reserva                                            |
| POST   | `/bookings/{id}/checkin`     | Realizar web check-in                                    |
| POST   | `/bookings/{id}/payments`    | Adicionar pagamentos (até 10 por vez, 120 parcelas cada) |
| POST   | `/bookings/{id}/attachments` | Anexar arquivo(s) via upload ou URL                      |

### Pagamentos e Custos

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| GET    | `/payment-methods` | Listar métodos de pagamento |
| GET    | `/cost-centers`    | Listar centros de custo     |

#### Payment Methods Response

```json
{
  "payment_methods": [
    { "id": 5, "name": "Dinheiro", "type": "in" },
    { "id": 8, "name": "Cartão de Crédito", "type": "in" },
    { "id": 12, "name": "PIX", "type": "in" }
  ]
}
```

Query param: `type` (optional) — `in` | `out` | `both` (default)

#### Cost Centers Response

```json
{
  "cost_centers": [
    { "id": 12, "name": "Hospedagem", "code": "3421" },
    { "id": 15, "name": "Alimentação", "code": "3422" },
    { "id": 18, "name": "Serviços Extras", "code": "3423" }
  ]
}
```

### Governança (Housekeeping)

| Method | Endpoint                          | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/units`                          | Listar unidades (agrupadas por tipo, status limpeza) |
| POST   | `/housekeeping/orders`            | Criar ordem de serviço                               |
| POST   | `/housekeeping/orders/{id}/close` | Fechar ordem de serviço                              |
| PATCH  | `/units/status`                   | Atualizar status de limpeza em massa (até 100)       |

## Webhooks

Events sent as HTTP POST to configured URL.

### Events

- `booking_created` — `{ "event": "booking_created", "data": { "booking_id": 12345, "timestamp": "2025-06-20T14:30:00Z" } }`
- `booking_canceled` — `{ "event": "booking_canceled", "data": { "booking_id": 12345, "timestamp": "2025-06-21T10:15:00Z" } }`

### Security

- Auth: Bearer Token in `Authorization` header
- Signature: HMAC-SHA256 in `X-Signature` header (signed with same token)
- Client must validate signature

### Delivery

- Must respond HTTP 200 within 5 seconds
- After 3 consecutive failures → webhook auto-disabled

## Error Codes

| Code | Description                                             |
| ---- | ------------------------------------------------------- |
| 401  | Unauthorized — missing or invalid ClientId/ClientSecret |
| 422  | Unprocessable Entity — validation errors in request     |
| 429  | Too Many Requests — rate limit exceeded                 |
| 500  | Internal Error — server-side issue                      |
