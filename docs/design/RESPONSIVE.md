# Responsividade e Breakpoints

> Mobile-first é obrigatório. Site executivo = mobile-first não-negociável.

## Filosofia

70%+ das reservas executivas começam no celular. Desktop é **enhancement**, não default. Toda página é desenhada partindo de 375px e progressivamente melhora em telas maiores.

## Breakpoints

```typescript
sm:  640px   // tablet retrato (Galaxy Tab)
md:  768px   // tablet paisagem / laptop pequeno
lg:  1024px  // desktop default
xl:  1280px  // desktop grande
2xl: 1536px  // ultrawide
```

## Estratégia por viewport

### Mobile (320-639px)

- **Layout**: 1 coluna, full-width
- **Navegação**: hamburger menu
- **Search**: modal full-screen, multi-step
- **Cards**: stack vertical
- **Filtros**: bottom sheet (modal)
- **Galeria**: swipeable, 1 foto por vez
- **CTAs**: full-width quando primários
- **Sticky elements**: minimizar (top header pequeno + bottom sheet quando ativo)
- **Fontes**: ligeiramente menores (display reduzido em 20%)

### Tablet (640-1023px)

- **Layout**: 1-2 colunas dependendo do contexto
- **Navegação**: full menu se couber, hamburger se não
- **Search**: inline expandido
- **Cards**: 2 colunas em grids
- **Filtros**: sidebar colapsável OU bottom sheet
- **Galeria**: 2 fotos por viewport

### Desktop (1024px+)

- **Layout**: até 3-4 colunas
- **Navegação**: full menu visível
- **Search**: persistente inline
- **Cards**: grid generoso
- **Filtros**: sidebar fixa
- **Galeria**: thumbnail strip + foto principal

## Container e padding

```typescript
// Container responsivo
<div className="container mx-auto px-4 md:px-6 lg:px-8">
```

Larguras máximas por contexto:
| Contexto | max-width |
|----------|-----------|
| Conteúdo institucional (text-heavy) | `max-w-3xl` (768px) |
| Listagem de quartos | `max-w-7xl` (1280px) |
| Hero | `max-w-screen-2xl` (1536px) |
| Footer | `max-w-7xl` |
| Admin | sem max (full-width) |

## Touch targets

Em mobile, **todo elemento clicável tem mínimo 44x44px** (recomendação Apple HIG e WCAG):

```css
/* Padrão obrigatório */
button,
a,
[role='button'] {
  min-height: 44px;
  /* padding interno cria a área de touch suficiente */
}
```

Espaçamento entre elementos clicáveis: mínimo 8px.

## Imagens responsivas

```tsx
<Image
  src={room.photo}
  alt={room.name}
  width={1200}
  height={675}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover"
  priority={isAboveFold}
/>
```

next/image automaticamente serve melhor formato (AVIF > WebP > JPG) e melhor resolução baseado no viewport.

## Tipografia responsiva

```typescript
// fluid typography com clamp()
'display-2xl': 'clamp(2.5rem, 5vw + 1rem, 4.5rem)'  // 40px → 72px
'display-xl':  'clamp(2.25rem, 4vw + 1rem, 3.75rem)' // 36px → 60px
'heading-xl':  'clamp(1.875rem, 2vw + 1rem, 2.25rem)' // 30px → 36px
```

Para body text, fixar em 16px+ mesmo mobile (legibilidade > densidade).

## Testes de responsividade

**Viewports obrigatórios em Playwright:**

- 375x667 (iPhone SE)
- 414x896 (iPhone 11)
- 768x1024 (iPad)
- 1280x720 (laptop pequeno)
- 1920x1080 (desktop)

Toda página crítica testada nesses 5 viewports antes de ir pra produção.

## Anti-padrões

- ❌ Esconder funcionalidade no mobile que existe no desktop
- ❌ Texto menor que 14px (exceto badges)
- ❌ Botões touch menor que 44px
- ❌ Hover-only interactions sem fallback de tap
- ❌ Modals que ocupam apenas 50% da tela em mobile
- ❌ Forçar zoom para conseguir tocar elementos
- ❌ Scroll horizontal não-intencional
- ❌ Fixed elements que cobrem conteúdo crítico
