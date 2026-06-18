/**
 * Hotel e Restaurante Paraíso — Design Tokens (Cores)
 *
 * Paleta: preto, branco, bege, dourado
 * Identidade: clássica, sofisticada, corporativa
 * Região: Ponte Nova, MG
 */

export const colors = {
  // Brand primárias
  brand: {
    black: '#1A1A1A',
    white: '#FFFFFF',
    beige: '#F5F0E8',
    gold: '#C9A96E',
  },

  // Variações de dourado
  gold: {
    50: '#FBF7EF',
    100: '#F5EBCF',
    200: '#EADAA5',
    300: '#DFC47A',
    400: '#D4AF5F',
    500: '#C9A96E', // brand gold
    600: '#B8944D',
    700: '#96763D',
    800: '#745A2F',
    900: '#523F21',
    950: '#2E2312',
  },

  // Variações de bege (backgrounds, superfícies)
  beige: {
    50: '#FDFCFA',
    100: '#FAF8F4',
    200: '#F5F0E8', // brand beige
    300: '#EDE5D5',
    400: '#E0D4BD',
    500: '#D1C3A5',
    600: '#B8A480',
    700: '#9A8564',
    800: '#7A6A50',
    900: '#5C503E',
    950: '#3D352A',
  },

  // Neutras (texto, bordas)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#1A1A1A', // brand black
    950: '#0A0A0A',
  },

  // Semânticas
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// Mapping para Tailwind CSS
export const tailwindColors = {
  brand: colors.brand,
  gold: colors.gold,
  beige: colors.beige,
  neutral: colors.neutral,
};
