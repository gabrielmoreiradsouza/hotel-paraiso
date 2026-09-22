import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Hardcode 'pt' for SSR/ISR — enables static generation and proper
  // cache-control headers (no more "private, no-store"). 99.9% of traffic
  // is Portuguese. English switching still works client-side via cookie +
  // page reload, but the server always renders PT for cacheability.
  const locale = 'pt';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
