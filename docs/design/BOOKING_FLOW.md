# Padrões UX — Motor de Reservas

> Especificação detalhada do fluxo de conversão. Cada decisão aqui afeta conversão diretamente.

## Filosofia

**Padrão OTA Booking-style como base, refinamento premium nos detalhes.** Familiaridade reduz fricção. Inovação onde diferencia (qualidade visual, copy), padronização onde converte (estrutura, fluxo).

## Macro-fluxo

```
Home (hero + search)
  → Listagem de quartos (filtros + cards)
    → Detalhe do quarto (galeria + info + CTA)
      → Checkout (3 passos: review → dados → confirmação)
        → Sucesso (resumo + próximos passos)
```

Variação válida (entrada direta via ads):

```
Landing específica (campanha) → Quartos → Checkout → Sucesso
```

## Passo 1 — Search inicial

### Posicionamento

- **Home**: search bar como elemento central, sobreposto ao hero (~30% do hero)
- **Listagem e detalhe**: search bar sticky no topo, sempre visível
- **Checkout**: search bar oculta (foco na conversão)

### Componentes

```
[📅 Datas: 15-18 Mar]  [👥 2 adultos, 0 crianças]  [🔍 Buscar]
```

### Validações

- Check-out > check-in (mínimo 1 noite)
- Mínimo 1 adulto
- Datas no passado bloqueadas
- Datas além de 18 meses bloqueadas (configurável)
- Pré-preencher com defaults inteligentes:
  - Datas: hoje + 7 dias / hoje + 9 dias (estadia média)
  - Adultos: 2
  - Crianças: 0

### Mobile-specific

- Search bar collapsed para `[Buscar disponibilidade]` button single
- Tap abre modal full-screen com:
  1. Calendário (full-screen, scroll vertical)
  2. Após selecionar datas → próximo step: hóspedes
  3. Após hóspedes → "Buscar"
- Steps com progresso visual no topo

### Estado durante busca

- Loading skeleton dos cards (não spinner)
- Mínimo 300ms de exibição (evita flash)
- Erro: mensagem clara + sugestão de ação ("Tente outras datas")

## Passo 2 — Listagem de quartos

### Layout desktop

```
┌──────────────────────────────────────────────────────┐
│ [SearchBar sticky no topo]                           │
├────────────┬─────────────────────────────────────────┤
│            │  3 quartos disponíveis para 15-18 Mar  │
│  FILTROS   │  ┌─────────────────────────────────┐    │
│            │  │ [Foto]  Quarto 1                │    │
│  Preço     │  │         Descrição               │    │
│  ◯ ◯ ◯ ◯  │  │         ⭐ 4.8                  │    │
│            │  │         R$ 450/noite [Reservar]│    │
│  Capacidade│  └─────────────────────────────────┘    │
│  □ 1 pessoa│  ┌─────────────────────────────────┐    │
│  ☑ 2 pessoas│ │ ... próximo card ...            │    │
│            │  └─────────────────────────────────┘    │
└────────────┴─────────────────────────────────────────┘
```

### Layout mobile

- Sem sidebar de filtros (botão "Filtros" abre sheet bottom)
- Cards stack vertical, full-width
- Foto no topo do card, info abaixo

### Card de quarto — anatomia

```
┌──────────────────────────────────────────────┐
│  [Foto 16:9 grande]                          │
│  ┌────────────────────────────────────────┐  │
│  │ Foto thumbnail strip (4-5)              │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  Suíte Master Vista Mar          ⭐ 4.8 (32) │
│  Vista panorâmica e jacuzzi privativa        │
│                                               │
│  👥 Até 2 adultos · 🛏 1 cama king          │
│  ✓ Wi-Fi · ✓ Café da manhã · ✓ Estacionamento│
│                                               │
│  ─────────────────────────────────────────── │
│                                               │
│  De R$ 450/noite                              │
│  Total 3 noites: R$ 1.350     [Selecionar →] │
└──────────────────────────────────────────────┘
```

### Hierarquia visual de preço

- "De R$ XXX/noite" — secondary, body-md
- "Total X noites: R$ XXXX" — primary, body-md weight-600
- Sem texto riscado (mostrar desconto só se houver promoção ativa real)
- Sem "preço a partir de" se preço variar pouco (transparência > flexibilidade)

### Filtros disponíveis

- Faixa de preço (slider)
- Capacidade (radio: 1, 2, 3, 4+)
- Amenidades (multi-checkbox)
- Vista (multi-checkbox: mar, montanha, jardim)
- Plano (refundável / não-refundável) — quando aplicável

### Sort

- Default: recomendado (algoritmo interno — pode misturar conversão histórica + capacidade)
- Opções: preço crescente, preço decrescente, melhor avaliado, mais escolhido

### Estados especiais

- **Sem disponibilidade nas datas**: card com "Tente datas próximas" + sugestões inteligentes
- **Apenas X disponíveis**: badge sutil "Últimas X" — APENAS se for verdade verificada via API, nunca fake urgency
- **Tarifa promocional ativa**: badge "Oferta limitada" + cor accent

## Passo 3 — Detalhe do quarto (opcional)

Muitos usuários decidem direto na listagem. Página de detalhe é para os que querem mais info.

### Estrutura

1. **Galeria full-width** (carrossel + thumbnails)
2. **Headline + descrição curta**
3. **Specs visuais** (ícones + texto): capacidade, camas, área, vista
4. **Amenidades completas** (grid)
5. **Sticky booking widget** (lateral desktop, bottom sheet mobile)
6. **Descrição detalhada** (storytelling, autoria)
7. **Avaliações** (com filtros)
8. **Política de cancelamento** (clara, sem letra miúda)
9. **FAQ específico** (se houver)
10. **CTA final** + relacionados (outros quartos)

### Sticky booking widget

```
┌──────────────────────┐
│ R$ 450/noite          │
│                       │
│ 📅 15 Mar - 18 Mar   │
│ 👥 2 adultos          │
│ [Editar datas]        │
│                       │
│ ─────────────────     │
│ Total 3 noites       │
│ R$ 1.350              │
│                       │
│ [Reservar agora]      │
│                       │
│ ✓ Cancelamento grátis │
│   até 48h antes        │
└──────────────────────┘
```

## Passo 4 — Checkout

### Visão geral

**3 telas no MVP** (sem pagamento online):

1. **Review** — confirme sua reserva
2. **Dados** — quem é você
3. **Confirmação** — pronto!

Stepper visual no topo:

```
[1. Review] → [2. Dados] → [3. Confirmação]
   ●
```

### Tela 1: Review

```
Sua reserva
─────────────────────────────────

[Foto] Suíte Master Vista Mar
       15 - 18 Mar 2026 · 3 noites
       2 adultos

Detalhamento de preço
─────────────────────────────────
3 noites × R$ 450               R$ 1.350
Taxa de turismo (R$ 5/diária)   R$ 15
─────────────────────────────────
Total                           R$ 1.365

✓ Café da manhã incluso
✓ Wi-Fi gratuito
✓ Cancelamento grátis até 48h antes

[Continuar →]
```

### Tela 2: Dados do hóspede principal

```
Quem está reservando?
─────────────────────────────────

Nome completo*                  [_____________________]
Email*                          [_____________________]
Telefone* (WhatsApp)            [(__) _____-____ ]
CPF*                            [___.___.___-__]

País                            [Brasil ▾]
Cidade                          [_____________________]

Observações (opcional)
[Pedidos especiais, horário previsto de chegada, etc.]
[________________________________________________]

☑ Aceito os termos e a política de privacidade
☐ Quero receber ofertas exclusivas por email

[← Voltar]  [Confirmar reserva →]
```

### Tela 3: Confirmação

```
       ✓
       Reserva confirmada!

Número da reserva: #12345
Enviamos os detalhes para gabriel@email.com

Sua estadia
─────────────────────────────────
Suíte Master Vista Mar
15 - 18 Mar 2026 · 3 noites · 2 adultos
Total: R$ 1.365

Próximos passos
─────────────────────────────────
📧 Email de confirmação enviado
💬 Nossa equipe entrará em contato via WhatsApp em até 1h
💳 Pagamento será feito no check-in

[Adicionar ao Google Calendar]  [Ver detalhes da reserva]
```

## Padrões de copy

### Tom geral

- **Direto e claro** para executivos
- **Português brasileiro natural** — sem "vossa", "estimado cliente"
- **Verbos no presente** ("Reserve agora", "Confirme")
- **Quantificadores específicos** ("3 noites" > "alguns dias")

### Microcopy crítico

| Contexto               | Copy correta                                                       | Copy ruim          |
| ---------------------- | ------------------------------------------------------------------ | ------------------ |
| CTA principal          | "Reservar agora"                                                   | "Enviar pedido"    |
| CTA secundário         | "Continuar"                                                        | "Próximo"          |
| Loading                | "Verificando disponibilidade..."                                   | "Carregando..."    |
| Erro genérico          | "Algo deu errado. Por favor, tente novamente em alguns instantes." | "Erro"             |
| Sem resultado          | "Não encontramos quartos para essas datas. Tente datas próximas?"  | "Nenhum resultado" |
| Sucesso                | "Reserva confirmada!"                                              | "Sucesso"          |
| Confirmação destrutiva | "Tem certeza que deseja cancelar?"                                 | "Confirmar?"       |

## Trust signals obrigatórios

Para executivos, confiança é decisivo. Sinalizar em pontos-chave:

| Posição       | Sinal                                                      |
| ------------- | ---------------------------------------------------------- |
| Header sempre | SSL lock + nome do hotel                                   |
| Listagem      | "Reserva direta sem taxas extras"                          |
| Detalhe       | Reviews com foto/nome (quando autorizado)                  |
| Checkout      | "Sem cobrança no momento — pagamento no check-in"          |
| Checkout      | "Cancelamento grátis até 48h antes" (se tarifa aplicável)  |
| Footer        | CNPJ, endereço completo, telefone, ícones de redes sociais |
| Toda página   | Botão WhatsApp flutuante com horário de atendimento        |

## Anti-padrões (NÃO fazer)

- ❌ Pop-up de desconto na entrada
- ❌ Countdown timer falso ("Oferta expira em 4:32")
- ❌ "31 pessoas vendo agora" se for fabricado
- ❌ Cores agressivas tipo vermelho urgência exagerada
- ❌ Tipos de quarto com nomes muito criativos que confundem (manter "Standard", "Superior", "Master", "Suíte Master")
- ❌ Tela de checkout em uma única página gigante (cansa em mobile)
- ❌ Forçar criação de conta antes de reservar
- ❌ Auto-aplicar cross-sell ("Quer um café da manhã premium por +R$50?") até depois da reserva confirmada
- ❌ Cores que mudam dependendo do quarto (consistência > variedade)

## Métricas a acompanhar

| Métrica                      | Alvo        | Crítico              |
| ---------------------------- | ----------- | -------------------- |
| Bounce rate na home          | <40%        | <60%                 |
| % home → listagem            | >50%        | >30%                 |
| % listagem → detalhe         | >24%        | >15%                 |
| % detalhe → checkout         | >40%        | >25%                 |
| % checkout → confirmação     | >44%        | >30%                 |
| Tempo médio até reserva      | <3min       | <8min                |
| Form abandonment no checkout | <30%        | <50%                 |
| Mobile conversion vs desktop | parity ±10% | desktop wins by <30% |

Acompanhar em painel admin (Fase 5). Anomalia >2σ dispara alerta + análise.
