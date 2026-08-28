import { ArtaxClient } from '@hotel-paraiso/artax-client';

/**
 * Cliente Artax compartilhado do app web.
 *
 * DR-001: toda chamada à Artax passa por aqui. O `fetch` direto contra artaxnet.com
 * ignora rate limiter, circuit breaker e timeout — e a chave da API é desativada
 * PERMANENTEMENTE em 102 req/60s (incidente 2026-06-18).
 *
 * O módulo mantém uma única instância por processo para que o rate limiter e o
 * circuit breaker sejam de fato compartilhados entre as rotas. Instanciar por request
 * zeraria os contadores e reabriria exatamente o buraco que a DR-001 fecha.
 */

const CLIENT_ID = process.env['ARTAX_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['ARTAX_CLIENT_SECRET'] ?? '';

export const isArtaxConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

let cached: ArtaxClient | null = null;

export function getArtaxClient(): ArtaxClient {
  if (!isArtaxConfigured) {
    throw new Error('Artax não configurado: ARTAX_CLIENT_ID/ARTAX_CLIENT_SECRET ausentes');
  }
  cached ??= new ArtaxClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    timeoutMs: 5000,
  });
  return cached;
}
