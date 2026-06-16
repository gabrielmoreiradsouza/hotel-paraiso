# INC-XXX: [Título curto e descritivo]

**Data do incidente:** YYYY-MM-DD HH:MM (timezone)  
**Data da resolução:** YYYY-MM-DD HH:MM  
**Severidade:** baixa | média | alta | crítica  
**Status:** aberto | investigando | resolvido | monitorando  
**Sentry fingerprint:** [se aplicável]

## Resumo

[1-2 frases descrevendo o que aconteceu]

## Impacto

- **Usuários afetados:** [número ou %]
- **Reservas afetadas:** [se aplicável]
- **Duração:** [tempo]
- **Receita impactada:** [se mensurável]

## Linha do tempo

| Horário | Evento                        |
| ------- | ----------------------------- |
| HH:MM   | Primeira ocorrência detectada |
| HH:MM   | Alerta disparado              |
| HH:MM   | Início da investigação        |
| HH:MM   | Causa identificada            |
| HH:MM   | Fix aplicado                  |
| HH:MM   | Resolução confirmada          |

## Sintomas

[O que era observável? Logs, erros, comportamento estranho]

## Root cause

[A causa **específica**. Não confundir com sintoma. Seja preciso.]

## Por que não foi pego antes?

[Tests não cobriam? Monitoramento cego nessa área? Caso de uso novo? Mudança recente?]

## Fix aplicado

[Descrição da correção específica. Link para commit/PR.]

## ⭐ Defensive rule derivada

**DR-XXX: [Título da regra]**

[A regra **genérica** que protege casos análogos. Não específica a este bug, mas a toda a classe.]

**Implementação:** [arquivo + descrição]  
**Lint rule:** [se aplicável]  
**Doc:** `docs/defensive-rules/DR-XXX-{slug}.md`

## ⭐ Test case criado

**Arquivo:** `[caminho/do/teste]`  
**Tipo:** unit | integration | e2e  
**Cenário coberto:** [descrição]

## Lições aprendidas

[O que descobrimos sobre o sistema? Sobre processos? Sobre prioridades?]

## Ações de follow-up

- [ ] Atualizar `docs/defensive-rules/ACTIVE.md`
- [ ] Atualizar `CLAUDE.md` se a regra for crítica
- [ ] Comunicar time (mesmo solo, registrar)
- [ ] Adicionar ao próximo retrospective mensal
- [ ] Revisar áreas análogas do sistema
