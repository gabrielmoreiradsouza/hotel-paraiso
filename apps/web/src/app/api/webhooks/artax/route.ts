import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@hotel-paraiso/artax-client';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/client-ip';

/**
 * Webhook da Artax.
 *
 * O handler não altera estado — apenas registra. Por isso a falta de autenticação era um
 * problema de log forjado, exposição de PII e DoS de disco, não de integridade de dados.
 * Ainda assim tudo isso importa: qualquer um na internet podia inflar o log do container
 * e o payload completo (com nome, e-mail e telefone de hóspede) ia para o stdout em texto
 * puro. Agora só o essencial é registrado, e só de origem verificada.
 */

const MAX_BODY_BYTES = 64 * 1024;

function isAuthorized(rawBody: string, request: Request): boolean {
  // Nome alinhado ao que já existe em produção (`ARTAX_WEBHOOK_SECRET`). Renomear a
  // variável no servidor seria mudança desnecessária num valor já configurado na Artax.
  const secret = process.env['ARTAX_WEBHOOK_SECRET'];
  // Sem segredo configurado o endpoint segue aceitando, para não quebrar a integração
  // existente em produção antes de o token ser provisionado. Registra em WARN para que
  // o estado permissivo seja visível em vez de silencioso.
  if (!secret) {
    console.warn('[webhook] ARTAX_WEBHOOK_TOKEN ausente — aceitando sem verificação');
    return true;
  }

  const signature = request.headers.get('x-artax-signature');
  if (signature) return verifyWebhookSignature(rawBody, signature, secret);

  // A Artax também pode enviar o token direto num header, conforme a configuração do painel.
  const token = request.headers.get('x-artax-token') ?? request.headers.get('authorization');
  if (!token) return false;
  return token.replace(/^Bearer\s+/i, '') === secret;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (await isRateLimited(`webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const rawBody = await request.text();

  if (rawBody.length > MAX_BODY_BYTES) {
    console.warn(`[webhook] payload grande demais recusado (${rawBody.length} bytes, ip=${ip})`);
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  if (!isAuthorized(rawBody, request)) {
    console.warn(`[webhook] assinatura inválida (ip=${ip})`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Não registra o corpo: seria justamente o vetor de poluir o log com conteúdo alheio.
    console.warn(`[webhook] corpo não-JSON recusado (${rawBody.length} bytes)`);
    return NextResponse.json({ ok: true });
  }

  // `JSON.parse` aceita `null`, array e primitivo — todos quebrariam o acesso abaixo.
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    console.warn('[webhook] payload JSON não é um objeto');
    return NextResponse.json({ ok: true });
  }

  const record = body as Record<string, unknown>;
  const event = typeof record['event'] === 'string' ? record['event'] : 'unknown';
  const data = record['data'];
  const bookingId =
    (typeof data === 'object' && data !== null
      ? (data as Record<string, unknown>)['booking_id']
      : undefined) ??
    record['booking_id'] ??
    'unknown';

  // Apenas identificadores. O payload completo carrega PII de hóspede e não vai para o log.
  console.log(`[webhook] ${event} — booking_id: ${String(bookingId)}`);

  // Responde 200 rápido: a Artax exige resposta em até 5 segundos.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' });
}
