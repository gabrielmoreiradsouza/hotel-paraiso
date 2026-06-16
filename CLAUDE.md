# Hotel Paraíso

Plataforma digital integrada que aprende continuamente. Motor de reservas + tracking + admin, integrado à Artax PMS.

**Domínio:** `hotelparaiso.moreirads.cloud` · **Owner:** Moreira Digital

## Antes de qualquer ação, leia na ordem:

1. **`docs/architecture/MASTER_BLUEPRINT.md`** — visão completa, princípios, stack, arquitetura
2. **`docs/architecture/PRINCIPLES.md`** — os 7 princípios não-negociáveis
3. **`docs/design/DESIGN_SYSTEM.md`** — sistema de design (público + admin)
4. **`docs/defensive-rules/ACTIVE.md`** — regras defensivas ativas (consultar SEMPRE antes de codar)
5. **`docs/decisions/INDEX.md`** — índice de ADRs (consultar antes de decisões arquiteturais)

## Para tarefas específicas, consulte:

**Arquitetura e engenharia**

- Stack e versões → `docs/architecture/STACK.md`
- Estrutura de pastas → `docs/architecture/STRUCTURE.md`
- MCPs e permissões → `docs/architecture/PERMISSIONS.md`
- Padrões de código → `docs/architecture/CODE_STANDARDS.md`
- Eventos de tracking → `docs/architecture/TRACKING.md`
- Schema de dados → `docs/architecture/DATA_MODEL.md`
- Fase atual e roadmap → `docs/architecture/ROADMAP.md`

**Design e UX**

- Design tokens → `docs/design/DESIGN_TOKENS.md`
- Componentes → `docs/design/COMPONENTS.md`
- Padrões UI por contexto → `docs/design/UI_PATTERNS.md`
- Animações → `docs/design/MOTION.md`
- Motor de reservas (UX) → `docs/design/BOOKING_FLOW.md`
- Admin (UX) → `docs/design/ADMIN_PATTERNS.md`
- Responsividade → `docs/design/RESPONSIVE.md`
- Acessibilidade → `docs/design/ACCESSIBILITY.md`
- Imagens e mídia → `docs/design/MEDIA.md`
- Referências validadas → `docs/design/REFERENCES.md`
- **Solicitações pendentes ao cliente** → `docs/design/references/PENDING.md`

**Documentação operacional**

- Templates de incidente → `docs/incidents/_TEMPLATE.md`
- Templates de ADR → `docs/decisions/_TEMPLATE.md`
- Runbooks → `docs/runbooks/`

## Fluxo obrigatório de mudanças:

1. Antes de codar → ler regras defensivas relacionadas
2. Antes de decisão arquitetural → criar ADR antes de aplicar
3. Antes de decisão visual nova → consultar `REFERENCES.md`; se faltar, adicionar em `PENDING.md`
4. Após resolver incidente → criar `INC-{n}.md` com root cause + defensive rule + test
5. Antes de cada PR → executar `pnpm learn-check`
6. Para Nível 4 (ver PERMISSIONS.md) → sempre confirmar com usuário

Para qualquer outra dúvida sobre o projeto, consulte primeiro o `MASTER_BLUEPRINT.md`.
