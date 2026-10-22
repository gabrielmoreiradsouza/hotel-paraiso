# ADR-0013: Teste A/B da página inicial (preço real e reserva sem trocar de página)

**Data:** 2026-10-21  
**Status:** aceito  
**Autor:** Claude (sessão hotel-paraiso-03), a pedido de Gabriel via design-mds-1e  
**Decisores:** Gabriel Moreira

## Contexto

Funil do tráfego pago de 06 a 21/10 (GA4): 54 visitantes → 8 buscaram datas → 4 escolheram
quarto → 0 reservas (5 foram ao WhatsApp). 85% saem antes de digitar datas; o preço real só
aparece depois das datas, em `/reservar`. Estadia curta (1,4 noite), decidida ~3 dias antes.

Hipótese: mostrar o preço real já na home e fechar a reserva por cima da página aumenta
`(reservas + cliques no WhatsApp) ÷ visitantes`.

## Decisão

- **A (controle):** home atual → `/reservar`.
- **B:** hero compacto + seção "Preços para as suas datas" (`QuickBook`) com datas
  pré-preenchidas (hoje antes das 18h de Brasília, senão amanhã; 1 noite; 2 hóspedes), preço
  e disponibilidade da Artax por quarto, e "Reservar" abrindo `CheckoutSheet` por cima da
  página (tela cheia no celular, painel lateral no desktop; `#reservar` no histórico para o
  voltar fechar). Mesmo contrato com `/api/bookings` do /reservar.

**Sorteio:** `apps/web/middleware.ts`, só em `/`. 50/50 na primeira visita, cookie `hp_ab`
(30 dias, não-httpOnly para o tracking ler). B é servida por **rewrite** para `/variante-b`
(URL continua `/`; UTM/gclid intactos; `/variante-b` é `noindex` com canonical `/`). Robôs
sempre veem A, sem cookie.

**Cache de borda:** `/` passa a `CDN-Cache-Control: no-store`. Com cache compartilhado no
Cloudflare, um visitante receberia a variante de outro. A página segue renderizada no servidor.

**Medição:** `track()` acrescenta `ab_variant` a todo evento (dataLayer, gtag, `/api/events`);
`purchase` do dataLayer também. No servidor, `/api/bookings` lê o cookie e grava `ab_variant`
na origem da reserva (`attr:{id}`) e no `purchase` do Measurement Protocol. O clique do
WhatsApp grava `ab_variant` (ADR-0012). Rótulos de conversão, `transaction_id`,
`client_id`/`session_id`, UTM/gclid e código do WhatsApp não mudaram.

## Opções consideradas

### Opção A: Rewrite no middleware (escolhida)

**Prós:** sem flash de conteúdo, sem layout shift, variante decidida antes do HTML.  
**Contras:** exige tirar `/` do cache de borda.

### Opção B: Sorteio no cliente (componente decide após hidratar)

**Contras:** a home renderiza A e troca para B — flash visível e CLS justamente no
primeiro paint que o teste quer melhorar; e quem sai antes da hidratação conta errado.

### Opção C: Ferramenta externa (Optimize/VWO)

**Contras:** script de terceiro no caminho crítico, custo, e o Google Optimize não existe mais.

## Consequências

### Positivas

- Variantes estáveis por visitante, medição no GA4 e no funil próprio com a mesma chave.

### Negativas

- `/` sem cache de borda: toda visita à home vai à origem.
- Middleware fica em `apps/web/middleware.ts` (não em `src/`): como existe `pages/_error.tsx`
  na raiz, é ali que o Next procura — em `src/` ele é ignorado sem aviso (descoberto no build).

### Neutras

- Encerrar o teste = remover o rewrite e a regra de cache de `/`; a variante vencedora vira a home.
- Critério: até 150 visitantes por variante ou 4 semanas (mínimo 2).
