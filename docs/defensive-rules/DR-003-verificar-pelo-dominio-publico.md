# DR-003: Comportamento que depende de cookie ou cabeçalho é verificado pelo domínio público

**Origem:** INC-003 (2026-10-27)
**Status:** ativa
**Categoria:** infrastructure

## Regra

Toda mudança cujo efeito depende de `Set-Cookie`, `Cache-Control` ou outro cabeçalho de
resposta (teste A/B, sessão, personalização) só está pronta depois de conferida em
`https://hotelparaiso.moreirads.cloud`, com o Cloudflare na frente. Teste contra a origem
ou unitário não basta: regras de zona do Cloudflare reescrevem cabeçalhos, apagam cookies e
forçam cache sem erro visível.

## Implementação

- A/B da home: `scripts/check-ab-edge.sh` (primeira visita recebe cookie e variante, o
  sorteio varia, cookie existente é respeitado). Rodar após todo deploy que toque `/`,
  `/variante-b`, o Worker ou regras do Cloudflare.
- Novas personalizações: acrescentar a checagem equivalente a esse script.
