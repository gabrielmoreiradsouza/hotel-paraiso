# /new-incident

Abrir novo registro de incidente seguindo o template.

Passos:

1. Identificar próximo número em `docs/incidents/`
2. Copiar `_TEMPLATE.md` para `INC-{NNN}-{slug}.md`
3. Preencher root cause, defensive rule, test case
4. Atualizar `docs/defensive-rules/ACTIVE.md` com nova DR
5. Criar arquivo de teste em `docs/defensive-rules/tests/DR-XXX.test.ts`
6. Implementar a defensive rule no código
7. Atualizar `CLAUDE.md` se a regra for crítica
8. Commit: `docs(incident): INC-NNN título curto`
