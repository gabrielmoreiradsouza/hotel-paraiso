const requests = new Map<string, number[]>();

export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (requests.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  requests.set(key, timestamps);
  return false;
}
