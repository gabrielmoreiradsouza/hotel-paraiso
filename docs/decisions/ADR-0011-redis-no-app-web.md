# ADR-0011: Redis como estado compartilhado do `apps/web`

**Data:** 2026-08-27
**Status:** aceito
**Autor:** Claude Code
**Decisores:** Gabriel Moreira

## Contexto

O `apps/web` é hoje totalmente stateless: não depende de `@hotel-paraiso/database`, não usa
Prisma, e o `Dockerfile` não recebe `DATABASE_URL` nem `REDIS_URL`. Ele fala apenas com a
Artax e com o CMS.

Isso bloqueia dois itens críticos da remediação pré-tráfego:

1. **Idempotência do `POST /api/bookings`** — sem estado compartilhado, um double-click ou
   um retry de proxy cria duas reservas reais na Artax, dois WhatsApp para o hotel e duas
   conversões enviadas ao Google Ads. Viola `CODE_STANDARDS.md:86-96`.
2. **Store de eventos de funil** — hoje um array em memória (`events/route.ts:13`). Com mais
   de uma réplica os números são por-instância, e todo deploy zera o histórico. O funil que
   embasa decisão de orçamento de campanha é, na prática, ficção.

A decisão precisa ser tomada **agora** porque tráfego pago está prestes a ser ligado, e
reserva duplicada é dano irreversível: envolve PMS, hóspede real e verba de campanha.

## Decisão

Adicionar **Redis** como dependência do `apps/web`, via `ioredis`, com degradação graciosa
para memória local quando indisponível.

Redis é o encaixe natural: TTL nativo expira chave de idempotência sem job de limpeza, e o
mesmo serviço resolve o store de eventos. O `infra/docker/docker-compose.yml` já provisiona
Redis para desenvolvimento local.

## Opções consideradas

### Opção A: Redis (escolhida)

**Prós:**

- TTL nativo — chave de idempotência expira sozinha, sem varredura
- Resolve idempotência e store de eventos com um único serviço
- Já provisionado no compose local; `REDIS_URL` já existe no `.env.example`
- Operações atômicas (`SET NX`) resolvem corrida entre réplicas corretamente

**Contras:**

- Serviço novo a provisionar no Easypanel, se ainda não existir lá
- Mais uma dependência de runtime que pode cair
- Perda de dados aceitável por design — não serve para o que precisa ser durável

### Opção B: Postgres via Prisma

**Prós:**

- Banco já existe e já tem a tabela `Booking`
- Durabilidade real
- Sem serviço novo

**Contras:**

- Prisma no bundle do Next aumenta o tamanho e o tempo de cold start
- Exige `DATABASE_URL` e rota de rede do container web até o Postgres — hoje não há nenhum dos dois
- Expiração de chave de idempotência vira job de limpeza escrito à mão
- Acopla o motor de reservas ao banco do backoffice sem necessidade

### Opção C: Memória por processo

**Prós:**

- Zero infraestrutura
- Pega o caso mais comum: double-click do mesmo usuário na mesma instância

**Contras:**

- Não protege entre réplicas nem sobrevive a deploy
- Store de eventos continua divergente entre instâncias
- Proteção parcial que aparenta ser completa — o pior dos mundos se não for rotulada

## Consequências

### Positivas

- Reserva duplicada deixa de ser possível dentro da janela de idempotência
- Funil de conversão passa a ser consistente entre réplicas e sobrevive a deploy
- Base pronta para o rate limiter distribuído (item 3.1 do plano de remediação)

### Negativas

- `REDIS_URL` passa a ser configuração obrigatória em produção
- Um serviço a mais para monitorar

### Neutras

- Redis indisponível **não derruba reservas**: o sistema degrada para idempotência em
  memória e registra o evento. Perder proteção entre réplicas é ruim; recusar toda reserva
  do hotel porque um cache caiu é pior.

## Próximos passos

- [x] Implementação (`lib/redis.ts`, `lib/idempotency.ts`, store de eventos)
- [x] `REDIS_URL` já presente no `.env.example`; é variável de runtime, injetada pelo
      Easypanel — não precisa de declaração no `Dockerfile`
- [x] Testes do modo degradado (`apps/web/src/__tests__/idempotency.test.ts`)
- [ ] **Provisionar Redis no Easypanel e configurar `REDIS_URL` em produção** — até lá o
      app roda em modo degradado: idempotência protege apenas dentro de cada réplica
- [ ] Migrar o rate limiter para Redis (item 3.1)

## Referências

- `docs/plans/REMEDIACAO_PRE_TRAFEGO.md` — itens 1.1 e 1.4
- `docs/defensive-rules/DR-001-artax-rate-limit.md`
- `docs/architecture/CODE_STANDARDS.md` — seção Idempotência
