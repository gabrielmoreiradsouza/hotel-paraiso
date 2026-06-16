// Validated environment variables for the API
export const env = {
  PORT: Number(process.env['PORT'] ?? 3001),
  NODE_ENV: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'staging' | 'production',
  DATABASE_URL: process.env['DATABASE_URL'] ?? '',
  REDIS_URL: process.env['REDIS_URL'] ?? '',

  // Sentry
  SENTRY_DSN: process.env['SENTRY_DSN'] ?? '',

  // GA4 Measurement Protocol
  GA4_MEASUREMENT_ID: process.env['GA4_MEASUREMENT_ID'] ?? '',
  GA4_API_SECRET: process.env['GA4_API_SECRET'] ?? '',

  // Meta CAPI
  META_PIXEL_ID: process.env['META_PIXEL_ID'] ?? '',
  META_ACCESS_TOKEN: process.env['META_ACCESS_TOKEN'] ?? '',

  // Resend
  RESEND_API_KEY: process.env['RESEND_API_KEY'] ?? '',

  // Artax (Fase 1)
  ARTAX_API_URL: process.env['ARTAX_API_URL'] ?? '',
  ARTAX_API_KEY: process.env['ARTAX_API_KEY'] ?? '',
} as const;
