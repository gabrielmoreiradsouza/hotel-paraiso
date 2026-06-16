# /learn-check

Verificar arquivos modificados contra regras defensivas ativas.

Executar:

1. `git diff --name-only origin/main...HEAD` para listar mudanças
2. Para cada arquivo, ler regras relacionadas em `docs/defensive-rules/ACTIVE.md`
3. Verificar padrões de violação
4. Reportar violações com link para regra correspondente
5. Bloquear PR se violação crítica
