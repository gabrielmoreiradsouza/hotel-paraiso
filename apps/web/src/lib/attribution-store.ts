import { withRedis } from './redis';
import type { Attribution } from '@hotel-paraiso/tracking';

export interface StoredAttribution extends Attribution {
  booking_id: string;
  label: string;
}

const TTL_SECONDS = 90 * 24 * 3600; // 90 days
const KEY_PREFIX = 'attr:';

const localStore = new Map<string, StoredAttribution>();

export async function storeAttribution(
  bookingId: string,
  attr: Attribution,
  label: string
): Promise<void> {
  const entry: StoredAttribution = { ...attr, booking_id: bookingId, label };
  const key = `${KEY_PREFIX}${bookingId}`;

  await withRedis(async (redis) => {
    await redis.set(key, JSON.stringify(entry), 'EX', TTL_SECONDS);
  }, undefined);

  localStore.set(bookingId, entry);
}

export async function getAttribution(bookingId: string): Promise<StoredAttribution | null> {
  const local = localStore.get(bookingId);
  if (local) return local;

  return withRedis(async (redis) => {
    const raw = await redis.get(`${KEY_PREFIX}${bookingId}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAttribution;
  }, null);
}

export async function listAttributions(
  bookingIds: string[]
): Promise<Record<string, StoredAttribution>> {
  const result: Record<string, StoredAttribution> = {};
  const missing: string[] = [];

  for (const id of bookingIds) {
    const local = localStore.get(id);
    if (local) {
      result[id] = local;
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) return result;

  await withRedis(async (redis) => {
    const keys = missing.map((id) => `${KEY_PREFIX}${id}`);
    const values = await redis.mget(...keys);
    for (let i = 0; i < missing.length; i++) {
      const raw = values[i];
      const id = missing[i] as string;
      if (raw) {
        const entry = JSON.parse(raw) as StoredAttribution;
        result[id] = entry;
        localStore.set(id, entry);
      }
    }
  }, undefined);

  return result;
}
