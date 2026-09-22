import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that overrides Cache-Control headers for public pages.
 *
 * Problem: force-dynamic in layout.tsx (required by next-intl) sets
 * Cache-Control: private, no-cache, no-store on ALL responses. This
 * prevents browser caching and hurts Core Web Vitals (LCP, TTFB).
 *
 * Solution: For public pages (not admin, api, or _next), override the
 * Cache-Control header to allow browser caching via stale-while-revalidate.
 * The CDN-Cache-Control header (set in next.config.ts) handles Cloudflare
 * edge caching separately.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-public paths
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Allow browser to cache for 10s and serve stale for 50s while revalidating.
  // This means repeat visits within 60s don't hit the server at all.
  // After 10s, the browser serves stale and revalidates in background.
  response.headers.set(
    'Cache-Control',
    'public, max-age=10, s-maxage=60, stale-while-revalidate=50'
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    '/((?!_next/static|_next/image|favicon.ico|brand|images).*)',
  ],
};
