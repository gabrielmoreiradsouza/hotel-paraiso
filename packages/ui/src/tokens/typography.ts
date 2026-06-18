/**
 * Hotel e Restaurante Paraíso — Design Tokens (Tipografia)
 *
 * Logo usa tipografia serifada clássica (old-style).
 * Fonte display: Playfair Display (serifada, elegante, similar ao monograma HRP)
 * Fonte body: Inter (sans-serif, legibilidade, moderna)
 */

export const fonts = {
  display: {
    family: "'Playfair Display', Georgia, 'Times New Roman', serif",
    googleFont: 'Playfair+Display:wght@400;500;600;700',
  },
  body: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    googleFont: 'Inter:wght@300;400;500;600;700',
  },
} as const;

export const fontSize = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
} as const;

export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em', // para uppercase labels
} as const;
