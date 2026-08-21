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
| GET    | `/booking/{id}`              | Retornar reserva pelo ID                                 |
| GET    | `/rooms/availability`        | Verificar disponibilidade de quartos                     |
| POST   | `/booking/create`            | Criar reserva                                            |
| POST   | `/booking/{id}/web-check-in` | Realizar web check-in                                    |
| POST   | `/booking/{id}/payments`     | Adicionar pagamentos (até 10 por vez, 120 parcelas cada) |
| POST   | `/booking/{id}/upload-file`  | Anexar arquivo(s) via upload ou URL                      |

### Pagamentos e Custos

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| GET    | `/payment-methods` | Listar métodos de pagamento |
| GET    | `/cost-centers`    | Listar centros de custo     |

### Governança (Housekeeping)

| Method | Endpoint                     | Description                                          |
| ------ | ---------------------------- | ---------------------------------------------------- |
| GET    | `/housekeeping`              | Listar unidades (agrupadas por tipo, status limpeza) |
| POST   | `/housekeeping`              | Criar ordem de serviço                               |
| PUT    | `/housekeeping/{unitId}`     | Fechar ordem de serviço                              |
| PATCH  | `/housekeeping/units/status` | Atualizar status de limpeza em massa (até 100)       |

---

## Detalhes dos Endpoints

### GET /bookings — Listar Reservas

Parâmetros query:

- `booking_id` (integer): Filtra por ID específico
- `status` (integer): 1-6
- `per_page` (integer): 20 (default), 50, 100, 200, 500
- `checkin` (date): Filtra por data de check-in
- `checkout` (date): Filtra por data de check-out
- `created` (date): Filtra pela data de criação
- `period_one` + `period_two` (date): Define período de busca
- `guest` (integer): Filtra por ID do hóspede
- `page` (integer): Paginação

Response 200:

```json
{
  "current_page": 1,
  "total_pages": 404,
  "total_bookings": 807,
  "bookings": [
    {
      "booking_id": 111111,
      "status": 1,
      "checkin": "2024-05-12",
      "checkout": "2024-05-15",
      "holder_guest": {
        "name": "Test Completed",
        "email": "test@artaxnet.com",
        "phones": ["55000000000"]
      },
      "guests": [{ "name": "Artaxnet API", "email": null, "phones": [] }],
      "provider": "API Artaxnet",
      "units": "Suite 3",
      "comment": "",
      "webcheckin_at": "2024-05-10 18:23:57",
      "created": "2024-05-09 15:03:07"
    }
  ],
  "next_page": "https://artaxnet.com/pms-api/v1/bookings?page=2"
}
```

### GET /booking/{ID} — Retornar Reserva pelo ID

Response 200:

```json
{
  "booking_id": 11111,
  "status": 1,
  "checkin": "2024-05-10",
  "checkout": "2024-05-12",
  "daily_value": 999.98,
  "total_reservation": 999.98,
  "holder_guest": {
    "name": "Api Teste",
    "email": "api@artaxnet.com.br",
    "phones": ["55000000000"]
  },
  "guests": [{ "name": "Artaxnet API", "email": null, "phones": [] }],
  "provider": "API Artaxnet",
  "rooms": [{ "room_type": "Suite Luxo", "name": "Suite 2", "unit_id": "CUSTOM-2" }],
  "units": "Suite 2",
  "comment": "",
  "webcheckin_at": "2024-05-08 18:23:57",
  "created": "2024-05-06 16:30:52"
}
```

### GET /rooms/availability — Verificar Disponibilidade

Parâmetros query:

- `arrival_date` (date, **obrigatório**): Data de Check-in (YYYY-MM-DD)
- `departure_date` (date, **obrigatório**): Data de Check-out (YYYY-MM-DD)
- `adults` (integer, **obrigatório**): Número de adultos
- `kids` (integer, **obrigatório**): Número de crianças
- `ages` (array, opcional): Idades das crianças (ex: `ages[]=5&ages[]=8`)

Response 200:

```json
{
  "rooms": {
    "<category_id>": {
      "<rateplan_id>": {
        "room_name": "Duplo Superior",
        "rateplan_id": 30,
        "room_type_id": 301,
        "rateplan_name": "Standard",
        "main_image": null,
        "allots": 2,
        "price_per_nights": 600,
        "price": 600,
        "cancellation_policy": "...",
        "pre_payment": true,
        "capacity": { "adults": 2, "kids": 1 },
        "taxes": []
      }
    }
  }
}
```

Estrutura: `rooms[category_id][rateplan_id] = { room details }`.
Sem disponibilidade retorna `{ "rooms": [] }`.

### POST /booking/create — Criar Reserva

Body (JSON):

```json
{
  "arrival_date": "2024-05-10",
  "departure_date": "2024-05-12",
  "rateplan_id": 30,
  "comment": "Opcional",
  "guest": {
    "first_name": "João",
    "last_name": "Silva",
    "document": "12345678901",
    "document_type": "cpf",
    "phone": "5531999999999",
    "email": "joao@email.com",
    "type": "guest"
  },
  "room_units": {
    "<category_id>": {
      "price": 600,
      "adults": 2,
      "kids": 0,
      "ages": [],
      "guests": [{ "first_name": "João", "last_name": "Silva" }]
    }
  }
}
```

- `room_units` é keyed por `category_id` (ex: `room_units[32][adults] = 2`)
- `price` é opcional — se omitido, usa valor do tarifário
- Response 200: `{ "booking_id": 1365372 }`

### POST /booking/{id}/web-check-in

Body (JSON):

```json
{
  "guest": {
    "is_guest": false,
    "first_name": "Mariana",
    "last_name": "Silva",
    "birthdate": "1991-08-12",
    "email": "mariana@example.com",
    "phone": "5511999999999",
    "document": "12345678901",
    "document_type": "cpf",
    "country": "BRA",
    "state": "SP",
    "city": "Sao Paulo"
  },
  "occupied_units": {
    "<unit_id>": [{ "first_name": "Carlos", "last_name": "Silva", "birthdate": "1989-03-18" }]
  },
  "arriving_from": "Campinas",
  "next_destination": "Rio de Janeiro",
  "trip_purpose": "leisure",
  "arriving_by": "automobile",
  "license_plate": "ABC1D23"
}
```

- `occupied_units` é keyed por `unit_id` (ID personalizado da unidade, obtido via GET /booking/{id} → rooms[].unit_id)
- Quando `guest.is_guest = true`, titular é alocado no primeiro quarto

Responses: 200 OK, 404 Not Found, 409 Check-in já realizado, 422 Validação

### POST /booking/{id}/payments — Adicionar Pagamentos

Body (JSON):

```json
{
  "payments": [
    {
      "payment_method_id": 5,
      "gross_amount": 1500.0,
      "installments": 3,
      "due_date": "2025-12-01",
      "obs": "Pagamento entrada + 2 parcelas",
      "confirmed": false,
      "cost_center_id": 12
    }
  ]
}
```

- Máximo 10 pagamentos por requisição, 120 parcelas cada
- `confirmed: true` cria pagamento já confirmado
- Operação atômica (rollback em caso de erro)

### POST /booking/{id}/upload-file — Anexar Arquivo

Aceita `multipart/form-data` (campo `file`) OU JSON `{ "urls": [...] }` (máx 4 URLs).
Tipos aceitos: jpg, jpeg, png, pdf. Máx 2MB.
Não enviar `file` e `urls` no mesmo request.

### GET /payment-methods

Query: `type` (opcional): `in` | `out` | `both` (default)

```json
{
  "payment_methods": [
    { "id": 5, "name": "Dinheiro", "type": "in" },
    { "id": 8, "name": "Cartão de Crédito", "type": "in" },
    { "id": 12, "name": "PIX", "type": "in" }
  ]
}
```

### GET /cost-centers

```json
{
  "cost_centers": [
    { "id": 12, "name": "Hospedagem", "code": "3421" },
    { "id": 15, "name": "Alimentação", "code": "3422" },
    { "id": 18, "name": "Serviços Extras", "code": "3423" }
  ]
}
```

### GET /housekeeping — Listar Unidades

Query: `status` (dirty|clean), `room_types[]` (array de IDs), `page`

Response: unidades agrupadas por tipo de quarto, com status de limpeza e ordens pendentes.

### POST /housekeeping — Criar Ordem

Body: `start_date`, `time`, `obs`, `units[]` (array de unit IDs), `employee_id`

### PUT /housekeeping/{unitId} — Fechar Ordem

Body: `start_date`, `end_date`, `time`, `obs`

### PATCH /housekeeping/units/status — Atualizar Status em Massa

Body: `units[]` com `unit_id` e `status` (dirty|clean). Máx 100 por request.

## Webhooks

Events: `booking_created`, `booking_canceled`

- Auth: Bearer Token no header `Authorization`
- Signature: HMAC-SHA256 no header `X-Signature`
- Deve responder HTTP 200 em 5 segundos
- 3 falhas consecutivas → webhook auto-disabled

## Error Codes

| Code | Description                                             |
| ---- | ------------------------------------------------------- |
| 401  | Unauthorized — missing or invalid ClientId/ClientSecret |
| 422  | Unprocessable Entity — validation errors in request     |
| 429  | Too Many Requests — rate limit exceeded                 |
| 500  | Internal Error — server-side issue                      |
