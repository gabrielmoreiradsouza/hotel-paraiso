# INC-003: Teste A/B da home não mediu nada por 6 dias (cache do Cloudflare)

**Data da detecção:** 2026-10-27
**Severidade:** alta (decisão de orçamento de mídia baseada num teste que não existia)
**Status:** resolvido
**Detectado por:** Claude, ao montar o relatório do WhatsApp por variante pedido por design-mds-3b

## Resumo

O teste A/B da home (ADR-0013) entrou no ar em 21/10 com o sorteio no middleware do Next e
`CDN-Cache-Control: no-store` em `/`. Na origem tudo funcionava: sorteio 50/50, cookie
`hp_ab`, `Cache-Control: private, no-store`.

Na frente dela, a regra de cache da zona (criada em 22/09 por desempenho) força cache em
`/`, reescreve o `Cache-Control` para `public, max-age=10` e **remove o `Set-Cookie`**. O
`CDN-Cache-Control: no-store` foi ignorado.

## Impacto

- Cada janela de cache servia uma única variante a todos (em 27/10: 12 de 12 em B).
- Ninguém recebia o cookie, então nenhum evento, clique de WhatsApp ou reserva levou
  `ab_variant`. Os 8 cliques com código de 21 a 27/10 saíram como `sem_variante`.
- Não há dado por variante desse período, nem no GA4 nem no funil próprio.

## Causa raiz

O teste foi validado só contra a origem (testes do middleware e build). Ninguém conferiu a
resposta **através do Cloudflare**, onde uma regra de zona tem a última palavra sobre
cabeçalhos e cache. A falha era silenciosa: a página carregava, a B aparecia, o 200 vinha.

## Correção aplicada

- Sorteio movido para um Worker na rota `hotelparaiso.moreirads.cloud/`
  (`apps/web/edge/ab-home-worker.js`). Ele busca `/` (A) ou `/variante-b` (B), cada uma
  com cache próprio, e acrescenta o cookie **depois** do cache. A home continua saindo do
  cache nas duas variantes.
- Middleware do Next removido: a origem nunca personaliza `/` por cookie, então a cópia em
  cache de `/` é sempre a A. Se o Worker cair, todos veem a A.
- A contagem do teste recomeça no deploy do Worker.

## Lição

Qualquer coisa que dependa de cookie ou de cabeçalho de resposta precisa ser verificada no
domínio público, não na origem. **Verificação:** `scripts/check-ab-edge.sh` — falha se a
home pública não devolver `Set-Cookie: hp_ab` e `x-ab-variant` numa primeira visita, ou se
o sorteio vier todo de uma variante só.
