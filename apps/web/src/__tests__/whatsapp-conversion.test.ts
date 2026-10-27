import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track } from '@hotel-paraiso/tracking';

/** Conversão do Google Ads no clique do WhatsApp (pedido design-mds-3b, 27/10). */

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('conversão do clique no WhatsApp', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockReset();
    const storage = memoryStorage();
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('window', {
      gtag,
      sessionStorage: storage,
      innerWidth: 390,
      location: { href: 'https://hotelparaiso.moreirads.cloud/', search: '' },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}')))
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const conversions = () => gtag.mock.calls.filter((c) => c[1] === 'conversion');

  it('dispara com o código como transaction_id e beacon', () => {
    track('whatsapp_clicked', { wa_code: 'S-7KQ3' });
    expect(conversions()).toEqual([
      [
        'event',
        'conversion',
        {
          send_to: 'AW-18401755556/Ub2HCNLg_qsdEKSD0sZE',
          transaction_id: 'S-7KQ3',
          transport_type: 'beacon',
        },
      ],
    ]);
  });

  it('conta uma vez por sessão, mesmo com código novo a cada toque', () => {
    track('whatsapp_clicked', { wa_code: 'S-7KQ3' });
    track('whatsapp_clicked', { wa_code: 'S-ZZ22' });
    expect(conversions()).toHaveLength(1);
    // O evento do funil continua saindo a cada toque.
    expect(gtag.mock.calls.filter((c) => c[1] === 'whatsapp_clicked')).toHaveLength(2);
  });

  it('não dispara a conversão do WhatsApp em outros eventos', () => {
    track('room_selected', { room: 'casal-luxo' });
    expect(conversions()).toHaveLength(0);
  });
});
