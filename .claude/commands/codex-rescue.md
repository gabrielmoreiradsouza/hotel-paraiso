# /codex-rescue

Delegar investigação ou fix ao Codex quando Claude está travado ou precisa de uma segunda opinião.

## Quando usar

- Claude não consegue resolver um bug após 2+ tentativas
- Precisa de diagnóstico de root cause em código complexo
- Quer segunda opinião sobre abordagem arquitetural
- Implementação grande que beneficia de paralelismo

## Processo

1. Coletar contexto relevante:
   - Arquivos envolvidos (ler conteúdo)
   - Erro ou stack trace (se houver)
   - O que já foi tentado
2. Delegar ao agente `codex:codex-rescue` com contexto completo
3. Avaliar resultado do Codex antes de aplicar
4. Se o fix do Codex for válido, aplicar e rodar testes
5. Se divergir, explicar ao usuário ambas abordagens
