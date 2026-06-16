# Modelo de Dados

> Schema Prisma de referência. Implementação em `packages/database/prisma/schema.prisma`.

## Hierarquia conceitual

```
Session (visitante anônimo)
  └── Touchpoint (origem: organic, ads, direto)
       └── Events (jornada: page_view, search, room_view...)
            └── Conversion (virou reserva)
                 └── Booking (a reserva no Artax)
                      └── Guest (hóspede)
                           └── Payments (futuramente)
```

## Entidades operacionais (espelham Artax)

### Room

- `id` (Int) — `room_type_id` da Artax
- `name`, `defaultCapacity`, `bedConfiguration` (Json)
- `artaxLastSyncAt`
- Relação 1:1 com `RoomContent` (Payload)

### RatePlan

- `id` (Int) — da Artax
- `name`, `isRefundable`
- `artaxLastSyncAt`

### AvailabilitySnapshot

- `id` (BigInt) auto-increment
- `roomId`, `date`, `available`, `price`
- `fetchedAt`
- Índices: `[roomId, date]`, `[fetchedAt]`

### Booking

- `id` (Int) — `booking_id` da Artax
- `status` (1-6 conforme Artax)
- `arrivalDate`, `departureDate`, `totalAmount`
- `source` (`'website' | 'artax_panel' | 'ota'`)
- `sessionId` (vínculo com jornada)
- `artaxLastSyncAt`
- Relações: `Guest`, `Payment[]`, `Room[]`, `RatePlan`

### Guest

- `id` (cuid)
- `email` (unique), `phone`, `firstName`, `lastName`
- `document` (unique) — **criptografado em repouso**
- Relação: `Booking[]`

### Payment

- `id` (cuid)
- `bookingId`, `amount`, `paymentMethodId`, `installments`, `dueDate`, `status`

## Entidades de jornada

### Session

- `id` (cuid)
- `userPseudoId` (GA4-compatible)
- `startedAt`, `lastSeenAt`
- Atribuição: `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent`, `gclid`, `fbclid`, `referrer`, `landingPage`
- Device: `userAgent`, `device`, `country`
- Relações: `AnalyticsEvent[]`, `Booking[]`

### AnalyticsEvent

- `id` (BigInt)
- `sessionId`, `eventName`, `eventCategory` (`'macro' | 'micro'`)
- `timestamp`, `pageUrl`, `payload` (Json)
- Flags: `sentToGa4`, `sentToMetaCapi`, `sentToGoogleAds`
- Índices: `[sessionId, timestamp]`, `[eventName, timestamp]`

## Entidades de sistema e aprendizado

### EventLog (append-only)

- `id` (BigInt)
- `aggregateType` (`'booking' | 'guest' | 'room' | ...`)
- `aggregateId`, `eventType` (`'created' | 'updated' | 'cancelled'`)
- `payload` (Json), `triggeredBy` (`'user' | 'system' | 'webhook' | 'sync'`)
- `occurredAt`

### SyncJob

- `id`, `type`, `status`, `startedAt`, `finishedAt`
- `itemsProcessed`, `itemsFailed`, `errorDetails` (Json)

### WebhookDelivery

- `id`, `source`, `eventType`, `payload`, `signatureValid`
- `status`, `receivedAt`, `processedAt`, `attempts`

### Incident

- `id`, `fingerprint` (unique — hash do stack)
- `title`, `description`, `rootCause`, `defensiveRule`, `testCaseRef`, `docRef`
- `status`, `occurrences`, `firstSeenAt`, `lastSeenAt`, `resolvedAt`

### PerformanceRegression

- `id`, `metric` (`'lcp' | 'inp' | 'cls' | 'api_p95'`)
- `baseline`, `current`, `pctChange`, `pageOrEndpoint`
- `detectedAt`, `resolved`

## Convenções gerais

- IDs: Artax usa Int, nossos usam cuid (legibilidade) ou BigInt (eventos)
- Timestamps: UTC sempre. Apresentação no fuso aplicável.
- Soft delete: apenas em entidades operacionais. Sistema e jornada são append-only.
- Encriptação em repouso: `document`, `email` (hash separado para lookup), `phone`
- Migrations: sempre versionadas, nunca destrutivas em produção sem ADR
