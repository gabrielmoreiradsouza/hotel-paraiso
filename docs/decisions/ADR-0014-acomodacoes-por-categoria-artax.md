# ADR-0014: Reserva por categoria real da Artax (catálogo de acomodações)

**Data:** 2026-11-16  
**Status:** aceito  
**Autor:** Claude (com Gabriel Moreira)  
**Decisores:** Gabriel Moreira

## Contexto

O hotel tem 46 UHs em 9 categorias na Artax (Individual Confort, Duplo Solteiro Confort,
Casal Confort, Casal Standard, Triplo Família Standard, Casal Luxo, Duplo Solteiro Luxo,
Casal Master, Triplo Família Master). O site agrupava tudo em 4 "quartos" do CMS
(Confort, Standard, Luxo, Master) e `selectOption` escolhia sozinho a subcategoria mais
barata. O hóspede nunca via tipo de cama, ar/ventilador nem frigobar.

Consequências observadas:

- Hóspede reservou Confort pelo site, caiu no UH 25 (Casal Confort) e reclamou do
  frigobar — o site anunciava frigobar no Confort e no Standard, que não têm.
- Casal podia receber Duplo Solteiro sem saber.
- Com as 9 categorias publicadas na API (16/11), 1 adulto passava a receber o Individual
  Confort (quarto compacto) sem aviso, e 3 adultos o Duplo Solteiro Luxo a R$ 554/noite
  (preço x3 incoerente na Artax). Hotfix `8a28830` escondeu os dois até esta entrega.
- As comodidades cadastradas na Artax divergem da realidade (Casal Confort com frigobar,
  Triplo Master sem), então a Artax não serve de fonte para comodidades.
- A Artax limita a ocupação total dos quartos "Casal" a 2: busca com 2 adultos + 1
  criança volta vazia, embora o hotel aceite 1 criança de até 12 anos.

Decisões do hotel (Gabriel, 16/11): reservar sem cobrar; vender todas as categorias;
1 criança de até 12 anos, sem custo, em qualquer quarto exceto o Individual Confort;
UH 16 (Casal Master sem frigobar) continua como Casal Master; Duplo Solteiro Luxo
vendido para até 2 pessoas.

## Decisão

O site passa a vender **a categoria real da Artax**. Cada categoria tem uma ficha num
catálogo versionado em código (`apps/web/src/lib/accommodations.ts`): grupo, nome, cama,
ar/ventilador, frigobar, máximo de adultos, se aceita criança, aviso obrigatório e fotos.

- A Artax continua dona do que existe e está à venda: preço, disponibilidade, rate plan.
- O catálogo é dono de como apresentar e de quem cabe (capacidade do catálogo vence a da
  Artax — por isso o Duplo Solteiro Luxo nunca sai para 3).
- O CMS continua dono do texto de marketing dos 4 grupos.
- Categoria publicada na Artax sem ficha no catálogo **não aparece nem é reservável** e
  gera `console.warn` — nunca se inventa comodidade para o que não foi conferido.
- `/api/availability` devolve grupos com a lista de opções, sem escolha automática.
- Criança: a busca vai à Artax só com adultos; a criança entra no comentário da reserva.
- Política de pagamento/cancelamento numa constante única
  (`apps/web/src/lib/booking-policy.ts`): sem cobrança antecipada, pagamento no hotel,
  cancelamento grátis até 1 dia antes (alinhado ao plano Standard da Artax).
- O comentário da reserva na Artax registra a categoria reservada, para conferir depois
  se a recepção alocou outra (`scripts/check-category-assignment.ts`).

## Opções consideradas

### Opção A: catálogo em código (escolhida)

**Prós:** entra no mesmo deploy, testável, revisável em diff, sem escrita no banco de
produção do CMS (que exige login de admin). Fichas mudam raramente.
**Contras:** o hotel não edita sozinho; mudança de comodidade passa por deploy.

### Opção B: nova coleção no Payload

**Prós:** hotel edita pelo painel.
**Contras:** migração e seed no banco de produção, que só aceita escrita autenticada;
mais uma fonte que pode divergir; atrasa a correção de um problema que já gera reclamação.

### Opção C: usar as comodidades e fotos da Artax

**Contras:** cadastro da Artax está errado (frigobar) e as fotos são de 2023, com mobília
antiga. Descartada.

## Consequências

### Positivas

- O hóspede vê e reserva exatamente cama, climatização e frigobar da categoria.
- O aviso do Individual Confort aparece antes de confirmar, no email, no WhatsApp e no
  comentário da Artax.
- Standard e Triplos passam a ser vendidos online; famílias com 1 criança conseguem reservar.

### Negativas

- Duas fontes (catálogo e Artax) precisam continuar coerentes; o `console.warn` e o
  script de conferência existem para isso.
- Muda a tela de reserva das duas variantes do teste A/B (ADR-0013) ao mesmo tempo. As
  duas recebem a mesma mudança, mas a comparação deve considerar 16/11/2026 como corte.

### Neutras

- Fotos: Individual Confort, Casal Confort e Casal Standard ficam sem foto até o hotel
  enviar (mensagem enviada em 16/11). Nunca se usa foto de outra acomodação.

## Próximos passos

- [x] Catálogo, API, 3 telas de reserva, página do quarto, email e WhatsApp
- [ ] Fotos das 3 categorias sem foto (aguardando hotel)
- [ ] Hotel corrigir na Artax: ocupação/preço x3 do Duplo Solteiro Luxo, frigobar no
      cadastro do Casal Confort e do Triplo Master
- [ ] Rodar `scripts/check-category-assignment.ts` semanalmente nas primeiras semanas

## Referências

- ADR-0013 (teste A/B da home)
- Hotfix `8a28830`
- `docs/plans/ACOMPANHAMENTO.md`
