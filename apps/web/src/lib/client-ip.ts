const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;

function isValidIp(value: string): boolean {
  if (IPV4.test(value)) {
    return value.split('.').every((part) => Number(part) <= 255);
  }
  return value.includes(':') && IPV6.test(value);
}

/**
 * Extrai o IP do cliente para uso como chave de rate limit.
 *
 * O código anterior usava o header `x-forwarded-for` cru e inteiro como chave. Isso dava
 * ao chamador controle total sobre a chave: mandar um valor diferente a cada request
 * criava um balde novo toda vez e anulava o rate limit por completo — inclusive o do
 * brute force de senha do admin.
 *
 * Ordem de preferência:
 * 1. `CF-Connecting-IP` — a Cloudflare o reescreve e remove cópias enviadas pelo cliente,
 *    então não é forjável quando o tráfego de fato passa por ela.
 * 2. Primeira entrada de `x-forwarded-for`, validada como IP.
 *
 * RESSALVA: se o proxy de produção *acrescenta* a `x-forwarded-for` em vez de sobrescrever,
 * a entrada 2 continua forjável — o atacante prefixa o IP que quiser. Validar o formato
 * reduz o espaço de chaves (não dá mais para inventar string arbitrária), mas não elimina
 * o problema. A correção definitiva depende de confirmar o comportamento do Easypanel/
 * Cloudflare e confiar apenas no header que o proxy garante. Ver item 3.2 do plano.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp && isValidIp(cfIp)) return cfIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first && isValidIp(first)) return first;
  }

  return 'unknown';
}
