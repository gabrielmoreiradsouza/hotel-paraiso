# Design Tokens

> Tokens canônicos do sistema. Localização da implementação: `packages/ui/src/tokens/`.

## Filosofia

**Tudo é token.** Nenhum valor mágico hardcoded em componentes. Quando a IDV chegar, trocamos os tokens e o sistema todo atualiza.

## Estrutura

```typescript
// packages/ui/src/tokens/index.ts
export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export { shadows } from './shadows';
export { motion } from './motion';
export { breakpoints } from './breakpoints';
export { zIndex } from './z-index';
```

## Cores (fallback até IDV)

```typescript
export const colors = {
  // Base
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(222 47% 11%)',

  // Surface (cards, modals)
  surface: {
    DEFAULT: 'hsl(0 0% 100%)',
    secondary: 'hsl(60 5% 96%)', // stone-100
    tertiary: 'hsl(240 5% 93%)', // zinc-200
  },

  // Borders
  border: {
    DEFAULT: 'hsl(240 6% 90%)', // zinc-200
    strong: 'hsl(240 5% 65%)', // zinc-500
  },

  // Primary (CTAs principais, links)
  primary: {
    DEFAULT: 'hsl(222 47% 11%)', // slate-900
    hover: 'hsl(217 33% 17%)',
    foreground: 'hsl(0 0% 100%)',
  },

  // Accent (CTAs de conversão, sucesso, confirmação)
  accent: {
    DEFAULT: 'hsl(160 84% 39%)', // emerald-600
    hover: 'hsl(161 94% 30%)',
    foreground: 'hsl(0 0% 100%)',
  },

  // Estados
  success: 'hsl(142 71% 45%)',
  warning: 'hsl(38 92% 50%)',
  error: 'hsl(0 84% 60%)',
  info: 'hsl(199 89% 48%)',

  // Texto
  text: {
    primary: 'hsl(222 47% 11%)',
    secondary: 'hsl(240 4% 46%)', // zinc-500
    tertiary: 'hsl(240 5% 65%)', // zinc-400
    inverse: 'hsl(0 0% 100%)',
  },
} as const;
```

### Regras de uso

- **Primary** apenas para CTA primário da página (1 por viewport)
- **Accent** para conversão final (botão "Reservar agora") — diferenciado para criar hierarquia
- **Success/Warning/Error** apenas para feedback de estado, nunca decorativo
- **Hierarquia de texto** sempre primary > secondary > tertiary

## Tipografia

### Famílias

```typescript
export const fonts = {
  display: 'var(--font-fraunces)', // serif elegante para títulos
  body: 'var(--font-inter)', // sans-serif para tudo
  mono: 'var(--font-jetbrains)', // monospace (admin)
};
```

Configurar em `apps/web/src/app/layout.tsx` via `next/font/google`:

- **Fraunces** — display, peso 300-700
- **Inter** — body, peso 400-700
- **JetBrains Mono** — apenas admin, peso 400-500

### Escala de tamanhos

Sistema **modular scale 1.250 (major third)** — proporção harmoniosa, usada por Apple, Stripe, Linear.

```typescript
export const typography = {
  // Display (apenas títulos hero)
  'display-2xl': { size: '4.5rem', line: '1.0', weight: 700, family: 'display' }, // 72px
  'display-xl': { size: '3.75rem', line: '1.0', weight: 700, family: 'display' }, // 60px
  'display-lg': { size: '3rem', line: '1.1', weight: 600, family: 'display' }, // 48px

  // Headings (h1-h6)
  'heading-xl': { size: '2.25rem', line: '1.2', weight: 600, family: 'display' }, // 36px - h1
  'heading-lg': { size: '1.875rem', line: '1.25', weight: 600, family: 'display' }, // 30px - h2
  'heading-md': { size: '1.5rem', line: '1.3', weight: 600, family: 'display' }, // 24px - h3
  'heading-sm': { size: '1.25rem', line: '1.4', weight: 600, family: 'body' }, // 20px - h4
  'heading-xs': { size: '1.125rem', line: '1.4', weight: 600, family: 'body' }, // 18px - h5

  // Body
  'body-lg': { size: '1.125rem', line: '1.6', weight: 400, family: 'body' }, // 18px
  'body-md': { size: '1rem', line: '1.6', weight: 400, family: 'body' }, // 16px - default
  'body-sm': { size: '0.875rem', line: '1.5', weight: 400, family: 'body' }, // 14px
  'body-xs': { size: '0.75rem', line: '1.5', weight: 400, family: 'body' }, // 12px

  // Labels e captions
  'label-md': { size: '0.875rem', line: '1.4', weight: 500, family: 'body' }, // 14px - form labels
  'label-sm': { size: '0.75rem', line: '1.3', weight: 500, family: 'body' }, // 12px - badges
  caption: { size: '0.75rem', line: '1.4', weight: 400, family: 'body' }, // 12px - hints
} as const;
```

### Regras de hierarquia

- **1 elemento `display-*`** por página, no máximo
- **1 elemento `heading-xl` (h1)** por página, obrigatório para SEO
- Hierarquia visual nunca pula nível (h1 → h3 sem h2)
- Body padrão é **`body-md` (16px)** — nunca menor para texto corrido

## Espaçamento

Escala baseada em **4px (0.25rem)** — sistema padrão Tailwind, familiaridade máxima.

```typescript
export const spacing = {
  '0': '0',
  '0.5': '0.125rem', // 2px
  '1': '0.25rem', // 4px
  '1.5': '0.375rem', // 6px
  '2': '0.5rem', // 8px
  '3': '0.75rem', // 12px
  '4': '1rem', // 16px - base
  '5': '1.25rem', // 20px
  '6': '1.5rem', // 24px
  '8': '2rem', // 32px
  '10': '2.5rem', // 40px
  '12': '3rem', // 48px
  '16': '4rem', // 64px
  '20': '5rem', // 80px
  '24': '6rem', // 96px
  '32': '8rem', // 128px
} as const;
```

### Padrões de aplicação

| Contexto                       | Valor                                        | Token Tailwind         |
| ------------------------------ | -------------------------------------------- | ---------------------- |
| Padding interno botão          | 12px 16px                                    | `py-3 px-4`            |
| Gap entre cards                | 16px (mobile), 24px (desktop)                | `gap-4 md:gap-6`       |
| Padding seção                  | 64px (mobile), 96px (desktop)                | `py-16 md:py-24`       |
| Padding container              | 16px (mobile), 24px (tablet), 32px (desktop) | `px-4 md:px-6 lg:px-8` |
| Stack vertical entre elementos | 8px (denso), 16px (normal), 24px (relaxado)  | `space-y-2 / 4 / 6`    |
| Espaçamento entre seções       | 48-96px                                      | `mb-12 md:mb-24`       |

## Border Radius

```typescript
export const radius = {
  none: '0',
  sm: '0.25rem', // 4px - badges
  md: '0.5rem', // 8px - inputs, small cards
  lg: '0.75rem', // 12px - cards default
  xl: '1rem', // 16px - modals, hero cards
  '2xl': '1.5rem', // 24px - feature cards
  full: '9999px', // pills, avatars
};
```

**Default da marca**: `radius.lg` (12px) — equilíbrio entre moderno e premium.

## Sombras

Sistema sutil, premium (não dramatic shadows):

```typescript
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  // Sombra premium para cards interativos (hover state)
  card: '0 2px 4px 0 rgb(0 0 0 / 0.04), 0 1px 2px 0 rgb(0 0 0 / 0.03)',
  'card-hover': '0 8px 16px -4px rgb(0 0 0 / 0.10), 0 4px 8px -2px rgb(0 0 0 / 0.04)',
};
```

## Z-Index

```typescript
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  banner: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
};
```

## Breakpoints

```typescript
export const breakpoints = {
  sm: '640px', // tablet retrato
  md: '768px', // tablet paisagem / laptop pequeno
  lg: '1024px', // desktop default
  xl: '1280px', // desktop grande
  '2xl': '1536px', // ultrawide
};
```

Mobile-first: estilos sem prefixo aplicam a partir de 0. Prefixos (`md:`, `lg:`) adicionam para telas maiores.

## CSS Variables

Tokens são expostos como CSS variables para uso fora do React (CMS, emails, etc.):

```css
:root {
  /* Cores */
  --color-primary: hsl(222 47% 11%);
  --color-accent: hsl(160 84% 39%);
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222 47% 11%);

  /* Tipografia */
  --font-display: var(--font-fraunces);
  --font-body: var(--font-inter);

  /* Espaçamento e radius já no Tailwind */

  /* Sombras */
  --shadow-card: 0 2px 4px 0 rgb(0 0 0 / 0.04), 0 1px 2px 0 rgb(0 0 0 / 0.03);
}

@media (prefers-color-scheme: dark) {
  /* Reservado para futuro modo escuro do admin */
}
```
