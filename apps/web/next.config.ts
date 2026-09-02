import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Content-Security-Policy.
 *
 * Sobre o `'unsafe-inline'` em `script-src`, que é uma concessão real e não um descuido:
 * o Next injeta scripts inline de hidratação, e GA4/Meta Pixel também. A alternativa
 * correta é nonce por request, o que exige middleware e desliga a geração estática das
 * páginas — custo alto para um site cujo maior risco não é XSS.
 *
 * Mesmo assim esta CSP entrega bastante: restringe de quais domínios scripts e conexões
 * podem vir (um script injetado não consegue exfiltrar para servidor arbitrário), bloqueia
 * `<object>`/`<embed>`, impede que a página seja embutida em iframe de terceiro, e trava
 * `base-uri` e `form-action` — que são vetores clássicos de sequestro de formulário.
 *
 * O que ela NÃO faz: impedir execução de script inline injetado. Migrar para nonce fica
 * registrado como melhoria futura.
 */
const CSP = [
  "default-src 'self'",
  // Google (GA4, Ads, Tag Manager) e Meta Pixel.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // O CMS serve as imagens dos quartos.
  "img-src 'self' data: blob: https://cms.hotelparaiso.moreirads.cloud https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://googleads.g.doubleclick.net",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://cms.hotelparaiso.moreirads.cloud",
  "frame-src 'self' https://www.googletagmanager.com https://td.doubleclick.net",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@hotel-paraiso/artax-client', '@hotel-paraiso/tracking'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 828, 1080, 1280],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'http' as const, hostname: 'localhost', port: '3003', pathname: '/api/media/**' },
      {
        protocol: 'https' as const,
        hostname: 'cms.hotelparaiso.moreirads.cloud',
        pathname: '/api/media/**',
      },
    ],
  },
  turbopack: {
    root: '../..',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            // Um ano, com subdomínios. Só é seguro porque todo o tráfego já é HTTPS via
            // Cloudflare; num domínio que ainda sirva HTTP em algum subdomínio, isto
            // deixaria o subdomínio inacessível pelo tempo do max-age.
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
      {
        // Public pages: allow Cloudflare edge to cache SSR HTML even though
        // cookies() opts into dynamic rendering. CDN-Cache-Control is respected
        // by Cloudflare and overrides Cache-Control for edge caching only.
        // Googlebot (no locale cookie) always gets the cached 'pt' version.
        source: '/((?!admin|api|reservar|_next|images).*)',
        headers: [
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=60',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/image(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
