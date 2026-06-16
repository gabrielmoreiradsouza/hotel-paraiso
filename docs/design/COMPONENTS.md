# Sistema de Componentes

> Inventário completo dos componentes a serem construídos. Base: shadcn/ui customizado com nossos tokens.

## Princípios

1. **shadcn/ui é o ponto de partida**, não o produto final. Todo componente é customizado para nossa identidade
2. **Composição > customização extensa** — preferir compor componentes pequenos do que prop-drilling
3. **Variants explícitas** — usar `class-variance-authority` (cva) para variações
4. **Forwarding ref e props** — todo componente aceita ref e ...props como native
5. **Acessibilidade obrigatória** — todo interativo tem foco visível, label semântico, contraste WCAG AA

## Estrutura de arquivo

```
packages/ui/src/components/
├── primitives/        # Base shadcn customizados
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Dialog.tsx
│   └── ...
├── composite/         # Compostos para domínio
│   ├── RoomCard.tsx
│   ├── DateRangePicker.tsx
│   ├── GuestSelector.tsx
│   └── ...
├── layout/            # Estrutura de página
│   ├── Container.tsx
│   ├── Section.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
└── feedback/          # Estados e feedback
    ├── Toast.tsx
    ├── Skeleton.tsx
    ├── ErrorState.tsx
    └── ...
```

## Inventário — Primitivos (Fase 0-1)

### Button

- Variantes: `primary`, `accent`, `secondary`, `ghost`, `link`, `destructive`
- Tamanhos: `sm`, `md` (default), `lg`, `icon`
- Estados: hover, active, disabled, loading
- Loading: spinner inline + texto preservado para estabilidade visual

### Input + Form components

- Input, Textarea, Select, Checkbox, Radio, Switch
- Estados: default, focus, error, disabled
- Label sempre acima (acessibilidade)
- Error message abaixo, em vermelho, com ícone
- Helper text discreto abaixo do label

### Card

- Variantes: `default`, `elevated` (sombra), `interactive` (clicável)
- Composição: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`

### Dialog / Modal

- Tamanhos: `sm`, `md`, `lg`, `xl`, `full`
- Mobile: sempre full-screen
- Backdrop blur sutil
- Foco trapped, scroll lock, ESC fecha

### Sheet (drawer lateral)

- Direções: `right` (default), `left`, `bottom`
- Mobile: usar para filtros, menu, etc.

### Toast

- Tipos: `success`, `error`, `warning`, `info`
- Posição: bottom-right desktop, top mobile
- Auto-dismiss: 5s default

### Tooltip e Popover

- Tooltip apenas para informação extra não-crítica
- Popover para conteúdo rico (calendários, seletores)

### Badge

- Variantes: `default`, `success`, `warning`, `error`, `info`, `outline`

### Skeleton

- Para loading states
- Match exato das dimensões do conteúdo final (evita CLS)

### Separator

- Horizontal e vertical, com espaçamento configurável

## Inventário — Compostos (Fase 1-3)

### Motor de reservas

**SearchBar (persistente no topo)**

```
[📅 Check-in - Check-out] [👥 2 adultos] [🔍 Buscar]
```

- Em desktop: inline, sempre visível
- Em mobile: collapsible, expande em modal full-screen
- Persistente entre páginas (estado em URL)
- Validação: check-out > check-in, mín 1 adulto

**DateRangePicker**

- Calendar dual-month (desktop) / single-month (mobile)
- Datas indisponíveis em cinza
- Preço por noite no hover (se conhecido)
- Tap to select range
- Min nights, max nights configuráveis por tarifa

**GuestSelector**

- Stepper para adultos (mín 1, máx por unidade)
- Stepper para crianças
- Idade de crianças (se afetar preço)
- Compacto mobile, expandido desktop

**RoomCard**

```
┌─────────────────────────────────────────┐
│ [Foto grande]    Nome do Quarto         │
│                  Descrição curta         │
│                  ✓ 2 adultos · ✓ Wi-Fi  │
│                  ⭐ 4.8 (32 reviews)     │
│                                          │
│                  De R$ XXX/noite         │
│                  Total: R$ XXXX          │
│                  [Selecionar]            │
└─────────────────────────────────────────┘
```

- Foto 16:9 grande à esquerda (desktop) / topo (mobile)
- Informações estruturadas
- Preço com hierarquia clara (por noite + total)
- CTA destacado

**RoomGallery**

- Modal full-screen
- Swipeable mobile, arrow keys desktop
- Thumbnails na lateral (desktop)
- Counter "1/12"
- Próximas fotos pre-loaded

**BookingSummary (sticky)**

- Sidebar à direita (desktop) / sticky bottom (mobile)
- Quarto selecionado
- Datas, hóspedes
- Breakdown de preço
- Botão "Continuar" / "Reservar"

**CheckoutForm**

- Stepper visual no topo (1. Quarto → 2. Dados → 3. Confirmação)
- Validação inline, erro abaixo do campo
- Auto-format CPF, telefone
- Inputs grandes, fáceis no mobile
- Botão "Continuar" sticky bottom mobile

**ConfirmationScreen**

- Success state visual claro
- Número da reserva destacado
- Resumo completo
- Próximos passos (email enviado, WhatsApp, etc.)
- CTA secundário (Adicionar ao Google Calendar)

### Site institucional

**Hero**

- Imagem grande (não vídeo no MVP — vídeo é Fase 3 enhancement)
- Headline + subtítulo + CTA
- Search bar embutida ou logo abaixo
- Altura: 70vh desktop, 60vh mobile

**Gallery**

- Grid masonry para galeria geral
- Lightbox modal para visualização
- Lazy load com blur placeholder

**FeatureGrid**

- 3-4 colunas desktop, stack mobile
- Ícone + título + descrição curta
- Use para amenidades, diferenciais

**TestimonialCard**

- Foto autor (opcional) + nome + cidade
- Texto em destaque
- ⭐⭐⭐⭐⭐ visual
- Data discreta

**FAQ Accordion**

- Único expandido por vez
- Animação smooth (max-height + opacity)
- Markdown rendering nas respostas

**LocationMap**

- Embed mapa (Google Maps ou Mapbox)
- Endereço + telefone + horários
- CTA "Como chegar"
- Lazy load (mapa pesa muito)

## Inventário — Admin (Fase 5)

Ver `ADMIN_PATTERNS.md`.

## Estados obrigatórios em TODO componente interativo

| Estado   | Tratamento                                 |
| -------- | ------------------------------------------ |
| Default  | Estado base                                |
| Hover    | Cursor pointer, sutil mudança visual       |
| Focus    | Outline visível (2px accent)               |
| Active   | Feedback visual de press                   |
| Disabled | Opacity 50%, cursor not-allowed, sem hover |
| Loading  | Spinner ou skeleton, preserva dimensões    |
| Error    | Visual claro, mensagem helpful             |
| Empty    | Mensagem + ilustração (não tela em branco) |

## Padrões de microinteração por componente

| Componente    | Animação                       | Duração  |
| ------------- | ------------------------------ | -------- |
| Button hover  | scale(1.02) + shadow lift      | 150ms    |
| Button click  | scale(0.98)                    | 100ms    |
| Card hover    | shadow lift + translateY(-2px) | 200ms    |
| Modal open    | fade + scale 0.95→1            | 200ms    |
| Sheet slide   | translateX/Y                   | 250ms    |
| Tab change    | fade entre conteúdos           | 150ms    |
| Form error    | shake X 3px + color            | 300ms    |
| Success toast | slide-in + fade                | 200ms    |
| Skeleton      | shimmer 1.5s loop              | infinito |

Todas com `prefers-reduced-motion` desabilitando movimento. Ver `MOTION.md`.

## Versionamento de componentes

- Toda mudança breaking em componente público → minor version bump em `packages/ui`
- Mudança visual não-breaking → patch
- Storybook atualizado a cada mudança
- Visual regression test via Playwright + Argos CI (Fase 3)
