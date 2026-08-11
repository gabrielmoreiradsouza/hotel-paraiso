# /codex-review

Revisão profunda do código modificado usando o Codex como segundo revisor.

## Processo

1. Executar `git diff --name-only HEAD` para listar arquivos modificados (staged + unstaged)
2. Se não houver diff, usar `git diff --name-only HEAD~1` (último commit)
3. Para cada arquivo modificado:
   a. Ler o conteúdo completo do arquivo
   b. Ler o diff específico (`git diff HEAD -- <arquivo>`)
4. Delegar ao agente `codex:codex-rescue` com o seguinte prompt:

   > Revise o código abaixo como um senior reviewer. Verifique:
   >
   > - Violações de regras defensivas em `docs/defensive-rules/ACTIVE.md`
   > - Violações de `docs/architecture/CODE_STANDARDS.md` (zero `any`, sem `as`, Zod na borda, erros tipados, idempotência)
   > - Bugs lógicos, race conditions, edge cases
   > - Vulnerabilidades de segurança (OWASP Top 10)
   > - Performance: queries N+1, re-renders desnecessários, memória
   > - Cobertura de testes: funções públicas sem teste correspondente
   >
   > Para cada issue encontrada, reporte:
   >
   > - Severidade: critical | warning | info
   > - Arquivo:linha
   > - Problema
   > - Sugestão de fix
   >
   > Se tudo estiver OK, confirme com "✓ Nenhum problema encontrado"

5. Apresentar resultado ao usuário
6. Se houver issues critical, sugerir correções antes do commit
