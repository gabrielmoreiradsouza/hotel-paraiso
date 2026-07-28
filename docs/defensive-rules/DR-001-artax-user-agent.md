### DR-001: Artax API requer User-Agent header

**Origem:** Incidente durante integração — API retornava 404 sem User-Agent
**Status:** ativa
**Categoria:** infrastructure
**Resumo:** A API da Artax PMS bloqueia requests sem header `User-Agent`, retornando 404 silencioso (sem mensagem de erro clara).
**Implementação:** `packages/artax-client/src/client.ts` — header `User-Agent: HotelParaiso/1.0`
**Teste:** Verificar que todas as chamadas à Artax incluem User-Agent

## Detalhes

- Sem `User-Agent`, a Artax retorna `{"error":"Not Found"}` com HTTP 404
- Com `User-Agent`, retorna os dados normalmente com HTTP 200
- O erro é indistinguível de um endpoint inexistente, o que causou dias de debugging
- Todas as chamadas HTTP à Artax DEVEM incluir `User-Agent: HotelParaiso/1.0`

## Regra

> Toda chamada HTTP para API externa DEVE incluir um header `User-Agent` identificando o sistema.
