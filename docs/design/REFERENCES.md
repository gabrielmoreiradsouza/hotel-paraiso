# Sistema de Referências Curadas

> Biblioteca viva de referências visuais e de UX que fundamentam decisões de design.

## Filosofia

**Nenhuma decisão visual relevante sem referência validada.** Em vez de adivinhar o que funciona, copiamos padrões testados de sites que provadamente convertem.

## Como o sistema funciona

### Fluxo durante desenvolvimento

```
1. Componente/decisão visual precisa ser criada
       ↓
2. Sistema consulta este documento
       ↓
3. Já existe referência?
       ├─ SIM → aplica o padrão referenciado
       └─ NÃO → abre solicitação em PENDING.md
              ↓
       4. Cliente envia referências OU autoriza decisão por best practice
              ↓
       5. Decisão tomada vira nova entrada aqui
```

### Tipos de referência

**Tier 1 — Padrões OTA validados (já incluídos)**
Sites que investem bilhões em conversion optimization. Copiar com segurança:

- Booking.com
- Airbnb
- Decolar
- Hoteis.com
- Expedia

**Tier 2 — Hotéis boutique premium**
Para refinamento visual sem sacrificar conversão:

- 1 Hotels (1hotels.com)
- The Hoxton (thehoxton.com)
- Aman Resorts (aman.com)
- Six Senses (sixsenses.com)

**Tier 3 — Sites específicos enviados pelo cliente**
Concorrentes diretos ou sites que você admira. **Estes têm prioridade** — você conhece o mercado melhor que qualquer benchmark genérico.

## Referências canônicas por componente

### Search bar (Tier 1)

**Padrão validado: Booking.com**

- Search bar com 3 campos: datas + hóspedes + buscar
- Posição: hero, ~30% do viewport
- Cor de fundo: branco com sombra sutil
- CTA destacado em accent color
- Sticky no topo após scroll

**Adaptação para Hotel Paraíso:**

- Mantém estrutura idêntica
- Tipografia mais elegante (Fraunces nos labels)
- Sombra mais sutil (premium feel)
- CTA com nossa accent color

### Calendar / DateRangePicker (Tier 1)

**Padrão validado: Airbnb**

- Dual-month em desktop
- Single month vertical em mobile (scroll infinito)
- Range selection com preenchimento animado
- Datas indisponíveis com strikethrough sutil
- Preço por noite no hover (quando aplicável)

### Card de quarto na listagem (Tier 1)

**Padrão validado: Booking.com**

- Foto grande à esquerda (60% do card)
- Info à direita (40%)
- Preço destacado bottom-right
- Trust signals: rating, reviews count
- CTA "Reservar" ou "Ver disponibilidade"

**Refinamento Tier 2:**

- The Hoxton usa fotos mais editoriais (não mockups genéricos)
- 1 Hotels usa whitespace mais generoso
- Aplicar AMBOS: estrutura Booking, qualidade visual Hoxton

### Galeria de fotos (Tier 1+2)

**Padrão Tier 1 (Airbnb):**

- Grid de 5 fotos no header (1 grande + 4 pequenas)
- Botão "Ver todas as fotos" abre modal

**Padrão Tier 2 (Aman):**

- Modal full-screen com carousel
- Background preto, foto centralizada
- Counter "3/24" + arrow keys

**Decisão: combinar.** Header tipo Airbnb + modal tipo Aman.

### Checkout (Tier 1)

**Padrão validado: Booking.com simplified**

- 3 etapas com stepper visual
- Sticky summary à direita (desktop) / bottom (mobile)
- Trust signals próximos ao botão final
- Email-first flow

### Mensagem de sucesso (Tier 2)

**Padrão validado: Linear/Stripe**

- Checkmark animado grande (única animação "celebratória")
- Mensagem clara em 1 linha
- Próximos passos explícitos
- CTA secundário (adicionar ao calendário, ver detalhes)

## Pontos de inspiração brasileiros

Importante: incluir referências do mercado nacional para tom de voz e contexto:

- **Caesar Park / Tauá Resorts** — referência local de premium
- **Pousada Maravilha / Pousada Toca da Coruja** — pousadas boutique nacionais com sites próprios
- **Decolar Hotéis** — UX OTA brasileira, padrões de copy em português
- **Hurb** — exemplo do que NÃO fazer (pressão excessiva, copy agressivo)

## Tier 3 — Referências validadas pelo cliente (2026-06-18)

### Ouro Minas Hotel (ourominas.com.br)

**Padrões extraídos:**

- Booking widget sticky (acompanha scroll), CTA burgundy (#83002d)
- Hero fullscreen com galeria de fotos em carrossel
- Campos: check-in, check-out, hóspedes — row (desktop) / column (mobile)
- Breakpoints: 767px / 768-1024px / 1025px+
- Navegação hamburger mobile, horizontal desktop

**Aplicar:** booking widget sticky com CTA dourado, hero fullscreen com fotos do hotel

### Booking.com

**Padrões de conversão:**

- Search widget centralizado no hero com autocomplete
- Date picker calendário duplo (desktop) / scroll vertical (mobile)
- Seletor hóspedes com +/- (adultos, crianças, quartos)
- Urgência: "Resta 1 quarto!", "Reservado 5x nas últimas 24h"
- Social proof: nota + classificação verbal + quantidade de avaliações
- Pricing: preço riscado + atual, "por noite", total calculado
- Bottom bar sticky mobile: preço + CTA
- Badge "Cancelamento gratuito" em verde

**Aplicar:** date picker duplo, seletor +/-, pricing "por noite" + total, bottom bar mobile

### Airbnb

**Padrões de conversão:**

- Search bar minimalista que expande ao clicar
- Cards com foto 1:1, carrossel swipeable, heart wishlist
- Grid de 5 fotos no listing (1 grande + 4 menores)
- Booking flow 3 steps máximo
- Login/cadastro DEPOIS da escolha (reduz fricção)
- Bottom sticky bar: preço + "Reservar"

**Aplicar:** grid 5 fotos no quarto, flow 3 steps, login pós-escolha, cards com carrossel

---

## Síntese — Estrutura do homepage (ordem validada)

1. **Hero** — foto fullscreen + headline + booking widget integrado
2. **Categorias de quartos** — cards com foto, nome, preço "a partir de"
3. **Diferenciais** — ícones + texto curto (Wi-Fi, estacionamento, pista, restaurante)
4. **Galeria** — grid de fotos interativo
5. **Experiências/Gastronomia** — seção com CTA
6. **Localização** — mapa + endereço + "como chegar"
7. **Avaliações** — social proof (quando disponível)
8. **CTA final** — "Reserve agora" com booking widget repetido
9. **Footer** — contato, links, redes sociais, políticas

## TODOs abertos

Ver `references/PENDING.md` para solicitações que precisam de input do cliente.

## Atualização deste documento

Toda nova decisão referenciada vira entrada aqui com:

```markdown
### [Nome do Componente] (Tier X)

**Padrão validado: [Fonte]**
[Descrição da estrutura ou padrão]

**Adaptação para Hotel Paraíso:**
[Modificações específicas justificadas]

**Screenshots:**
[Links ou anexos em references/screenshots/]

**Data da decisão:** YYYY-MM-DD
**ADR relacionado:** ADR-XXX (se aplicável)
```

## Como solicitar referências

Quando uma decisão precisa de input seu:

1. Sistema cria entrada em `references/PENDING.md`
2. Estrutura da solicitação:
   - **Contexto**: o que precisa ser desenhado
   - **Pergunta específica**: o que está em jogo
   - **Sugestões iniciais**: 2-3 sites para você analisar
   - **Prazo**: quando é necessário (linkado à fase)
3. Você envia (link, screenshot, ou descrição)
4. Sistema migra para `REFERENCES.md` com a decisão

Isso transforma o projeto em uma biblioteca curada ao longo do tempo. **Você não precisa decidir tudo agora** — decide na hora certa, com as referências certas.
