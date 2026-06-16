# Padrões de Código

> Obrigatórios. Validados em CI. Ver `defensive-rules/` para regras aprendidas com incidentes.

## TypeScript

### Configuração estrita

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true
}
```

### Regras

- **Zero `any`** — usar `unknown` + narrowing
- **Sem `as` exceto type guards** — preferir validação Zod
- **Sem `!` (non-null assertion)** — validar antes
- **Tipos explícitos em APIs públicas** — inferência só para internos

## Validação de input

Toda entrada externa (HTTP, webhook, queue) **passa por Zod** na borda:

```typescript
const CreateBookingSchema = z
  .object({
    arrival_date: z.coerce.date(),
    departure_date: z.coerce.date(),
    // ...
  })
  .refine((data) => data.departure_date > data.arrival_date, {
    message: 'departure must be after arrival',
  });

// Em handler:
const input = CreateBookingSchema.parse(req.body);
```

## Erros

### Hierarquia

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public context?: Record<string, unknown>
  )
}

class ValidationError extends AppError { /* 422 */ }
class NotFoundError extends AppError { /* 404 */ }
class IntegrationError extends AppError { /* 502 */ }
class RateLimitError extends AppError { /* 429 */ }
```

### Regras

- **Sempre tipado** — nunca `throw new Error(...)`, usar `AppError`
- **Contexto rico** — incluir IDs relevantes, payload sanitizado
- **Sempre logado antes de propagar**
- **Nunca silenciado** — `catch` sem rethrow é proibido (ESLint rule)

## Chamadas externas

Toda chamada para API externa tem:

1. **Timeout explícito** (5s default, 30s para uploads)
2. **Retry com exponential backoff** (3 tentativas)
3. **Circuit breaker** (abre após 5 falhas consecutivas)
4. **Rate limit interno** (respeita limites da API destino)
5. **Logging estruturado** (request_id, duration, status)

Implementado em `packages/artax-client/` como referência.

## Idempotência

Operações que mudam estado devem ser idempotentes:

```typescript
// Padrão: chave de idempotência
await bookingService.create({
  idempotencyKey: `web-${session_id}-${timestamp}`,
  // ...
})

// Ou: natural key
await guestService.upsert({ document, ... })  // por documento
```

## Event sourcing leve

Toda mudança de estado relevante:

```typescript
await prisma.$transaction(async (tx) => {
  const booking = await tx.booking.create({ ... })

  await tx.eventLog.create({
    data: {
      aggregateType: 'booking',
      aggregateId: booking.id.toString(),
      eventType: 'created',
      payload: { ... },
      triggeredBy: 'user'
    }
  })
})
```

## Naming

### Funções

- **Verbo + substantivo**: `createBooking`, `getAvailability`
- **Boolean com prefix**: `isAvailable`, `hasPayment`, `canCancel`
- **Async sem sufixo**: `loadGuest()` não `loadGuestAsync()`

### Variáveis

- camelCase
- Descritivas, sem abreviações criativas
- `i`, `j` apenas em loops curtos
- Constantes UPPER_SNAKE_CASE

### Arquivos

- Componentes React: `RoomCard.tsx`
- Hooks: `useAvailability.ts`
- Services: `BookingService.ts`
- Tipos: `Booking.ts`
- Utils: `formatCurrency.ts`

## Comentários

- **Explicar o porquê, não o quê**
- JSDoc apenas em APIs públicas
- TODOs com responsável e issue: `// TODO(moreira #42): ...`
- Sem código comentado — usar Git

## Testes

### Toda função pública tem teste

- Vitest para unit + integration
- Playwright para E2E
- Coverage mínimo: 70% global, 90% em `domain/`

### Estrutura

```typescript
describe('BookingService.create', () => {
  it('creates booking when room is available', ...)
  it('throws when departure before arrival', ...)
  it('is idempotent with same idempotencyKey', ...)
  it('rolls back on Artax failure', ...)
})
```

## Git

### Branches

- `main` — produção
- `develop` — homologação
- `feature/*`, `fix/*`, `chore/*`

### Commits — Conventional Commits

```
feat(booking): adicionar suporte a pré-reservas
fix(tracking): corrigir deduplicação de eventos
chore(deps): atualizar Next.js para 15.2
docs(adr): documentar escolha de Payload
```

### PRs

- Título no formato Conventional Commit
- Descrição com: o que, por que, como testar, screenshots
- Pelo menos 1 review (mesmo solo, auto-review com checklist)
- CI verde obrigatório
- Sem merge se há mudança em regra defensiva sem atualização do doc

## Logging

```typescript
logger.info({ bookingId, sessionId }, 'booking created');
logger.error({ err, bookingId }, 'failed to sync booking with artax');
```

- **Sempre estruturado** (objeto + mensagem)
- **Nunca logar dados sensíveis** (CPF, senha, token)
- **Request_id em todo log** de request
- **Nível apropriado**: trace, debug, info, warn, error, fatal
