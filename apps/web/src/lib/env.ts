// Validated environment variables for the web app
export const env = {
  // Analytics
  GA4_MEASUREMENT_ID: process.env['NEXT_PUBLIC_GA4_MEASUREMENT_ID'] ?? '',
  GTM_CONTAINER_ID: process.env['NEXT_PUBLIC_GTM_CONTAINER_ID'] ?? '',

  // Sentry
  SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'] ?? '',

  // API
  API_URL: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001',
} as const;
