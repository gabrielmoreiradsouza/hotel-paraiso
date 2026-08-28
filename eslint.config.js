import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // DR-001: a chave da API Artax é desativada PERMANENTEMENTE em 102 req/60s.
    // A proteção (rate limiter, circuit breaker, timeout) vive no ArtaxClient — um
    // `fetch` direto contra artaxnet.com a contorna inteira, que foi exatamente como
    // as rotas do site voltaram a ficar expostas. Só o próprio pacote pode citar o host.
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'packages/**/*.ts'],
    ignores: ['packages/artax-client/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/artaxnet\\.com/]',
          message:
            'DR-001: não chame artaxnet.com direto. Use @hotel-paraiso/artax-client (rate limiter + circuit breaker + timeout).',
        },
        {
          selector: 'TemplateElement[value.raw=/artaxnet\\.com/]',
          message:
            'DR-001: não chame artaxnet.com direto. Use @hotel-paraiso/artax-client (rate limiter + circuit breaker + timeout).',
        },
      ],
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/.next/',
      '**/build/',
      '**/coverage/',
      '**/.turbo/',
      '**/next-env.d.ts',
    ],
  }
);
