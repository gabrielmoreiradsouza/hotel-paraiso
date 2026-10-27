import { describe, it, expect } from 'vitest';
import type { WaMessage } from '../lib/evolution-messages';
import { parseRecord } from '../lib/evolution-messages';
import { analyzeFunnel, codeInMessage, isOffer, toBrasiliaIso } from '../lib/whatsapp-funnel';
import type { WhatsAppClick } from '../lib/whatsapp-leads';

/** ADR-0012 — funil clique → conversa → oferta → reserva. */

const T0 = Date.parse('2026-10-20T12:00:00Z');
const min = (n: number) => T0 + n * 60_000;

function click(code: string, at: number, campaign?: string, ab_variant?: string): WhatsAppClick {
  return {
    code,
    at: new Date(at).toISOString(),
    page: '/',
    ab_variant,
    origem: campaign
      ? { source: 'google', medium: 'cpc', campaign }
      : { source: '(direct)', medium: '(none)' },
  };
}

function msg(chat: string, at: number, fromMe: boolean, text: string, phone?: string): WaMessage {
  return { chat, phone: phone ?? null, fromMe, at, text };
}

describe('detecção nas mensagens', () => {
  it('acha o código do texto padrão do botão', () => {
    expect(
      codeInMessage('Olá! Vim pelo site do Hotel Paraíso e quero fazer uma reserva. Código: S-7KQ3')
    ).toBe('7KQ3');
    expect(codeInMessage('codigo: s-uv23')).toBe('UV23');
    expect(codeInMessage('Bom dia, quero um quarto')).toBeNull();
  });

  it('reconhece oferta pelo valor, tarifa, disponibilidade ou link', () => {
    expect(isOffer('O casal luxo fica R$ 165 com café')).toBe(true);
    expect(isOffer('A diária está 209')).toBe(true);
    expect(isOffer('Temos disponibilidade sim')).toBe(true);
    expect(isOffer('Reserve aqui: https://hotelparaiso.moreirads.cloud/reservar')).toBe(true);
    expect(isOffer('Bom dia! Um momento por favor')).toBe(false);
  });

  it('lê o registro da Evolution e descarta grupos', () => {
    expect(
      parseRecord({
        key: { fromMe: false, remoteJid: 'abc@lid', remoteJidAlt: '5531999998888@s.whatsapp.net' },
        message: { conversation: 'oi' },
        messageTimestamp: 1_790_000_000,
      })
    ).toEqual({
      chat: 'abc@lid',
      phone: '5531999998888',
      fromMe: false,
      at: 1_790_000_000_000,
      text: 'oi',
    });
    expect(
      parseRecord({ key: { remoteJid: '123@g.us' }, message: {}, messageTimestamp: 1 })
    ).toBeNull();
  });
});

describe('analyzeFunnel', () => {
  const clicks = [
    click('7KQ3', min(0), 'hrp_regional', 'B'),
    click('ZZ22', min(10), 'hrp_local'),
    click('AB34', min(300)),
  ];

  const messages = [
    // Conversa com código, respondida em 5 min com valor, virou reserva pelo telefone.
    msg('c1@lid', min(1), false, 'Vim pelo site... Código: S-7KQ3', '5531999998888'),
    msg('c1@lid', min(6), true, 'Bom dia! Casal Luxo R$ 165', '5531999998888'),
    // Número novo, sem código, 15 min depois do clique ZZ22 → provável site, sem resposta.
    msg('c2@lid', min(25), false, 'oi, quero um quarto', '5531977776666'),
    // Número já conhecido escrevendo perto do clique AB34 → não conta.
    msg('c3@lid', min(310), false, 'oi de novo', '5531955554444'),
    // Conversa qualquer sem clique por perto → fora do funil.
    msg('c4@lid', min(900), false, 'tem vaga?', '5531933332222'),
  ];

  const bookings = [
    {
      booking_id: 1,
      createdAt: min(120),
      phones: ['31 99999-8888'],
      codes: [],
      value: 330,
    },
    // Mesmo telefone, mas criada antes do contato → não casa.
    { booking_id: 2, createdAt: min(-60), phones: ['31977776666'], codes: [], value: 100 },
  ];

  const result = analyzeFunnel({
    clicks,
    clicksByCode: { '7KQ3': clicks[0] as WhatsAppClick },
    messages,
    knownChats: new Set(['c3@lid']),
    bookings,
  });

  it('monta as etapas por origem', () => {
    expect(result.por_origem.hrp_regional).toEqual({
      cliques: 1,
      conversas_codigo: 1,
      provaveis_site: 0,
      ofertas: 1,
      reservas: 1,
      valor: 330,
    });
    expect(result.por_origem.hrp_local).toMatchObject({ cliques: 1, provaveis_site: 1 });
    expect(result.por_origem.direto).toMatchObject({ cliques: 1, provaveis_site: 0 });
    expect(result.total).toMatchObject({ cliques: 3, conversas_codigo: 1, provaveis_site: 1 });
  });

  it('separa por variante A/B', () => {
    expect(result.por_variante['B']).toMatchObject({ cliques: 1, reservas: 1 });
    expect(result.por_variante['sem_variante']).toMatchObject({ cliques: 2, provaveis_site: 1 });
  });

  it('mede resposta e mostra só os 4 últimos dígitos do telefone', () => {
    expect(result.tempo_medio_primeira_resposta_min).toBe(5);
    expect(result.sem_resposta).toBe(1);
    expect(result.conversas.map((c) => c.phone_last4).sort()).toEqual(['6666', '8888']);
    expect(JSON.stringify(result)).not.toContain('99999');
  });

  it('casa reserva pelo código na observação', () => {
    const viaCode = analyzeFunnel({
      clicks,
      clicksByCode: { '7KQ3': clicks[0] as WhatsAppClick },
      messages: [msg('c1@lid', min(1), false, 'Código: S-7KQ3')],
      knownChats: new Set(),
      bookings: [{ booking_id: 9, createdAt: min(60), phones: [], codes: ['7KQ3'], value: 200 }],
    });
    expect(viaCode.total).toMatchObject({ reservas: 1, valor: 200 });
  });

  it('separa duas visitas com códigos diferentes no mesmo chat', () => {
    const k1 = click('AAA2', min(0), 'hrp_regional');
    const k2 = click('BBB3', min(2000), 'hrp_local');
    const r = analyzeFunnel({
      clicks: [k1, k2],
      clicksByCode: { AAA2: k1, BBB3: k2 },
      messages: [
        msg('c@lid', min(1), false, 'Código: S-AAA2', '5531911112222'),
        msg('c@lid', min(3), true, 'Olá, um momento'),
        msg('c@lid', min(2001), false, 'Código: S-BBB3', '5531911112222'),
        msg('c@lid', min(2002), true, 'Fica R$ 209'),
        // Reenvio do mesmo código não vira outra conversa.
        msg('c@lid', min(2003), false, 'Código: S-BBB3'),
      ],
      knownChats: new Set(),
      bookings: [],
    });
    expect(r.por_origem.hrp_regional).toMatchObject({ conversas_codigo: 1, ofertas: 0 });
    expect(r.por_origem.hrp_local).toMatchObject({ conversas_codigo: 1, ofertas: 1 });
    expect(r.total.conversas_codigo).toBe(2);
  });

  it('casa a primeira reserva após o contato e prefere o código ao telefone', () => {
    const k = click('CCC4', min(0), 'hrp_regional');
    const base = {
      clicks: [k],
      clicksByCode: { CCC4: k },
      messages: [msg('c@lid', min(1), false, 'Código: S-CCC4', '5531988887777')],
      knownChats: new Set<string>(),
    };
    const later = {
      booking_id: 20,
      createdAt: min(500),
      phones: ['31988887777'],
      codes: [],
      value: 1,
    };
    const earlier = {
      booking_id: 10,
      createdAt: min(100),
      phones: ['31988887777'],
      codes: [],
      value: 2,
    };
    const tooLate = {
      booking_id: 30,
      createdAt: min(15 * 1440),
      phones: ['31988887777'],
      codes: [],
      value: 3,
    };
    expect(
      analyzeFunnel({ ...base, bookings: [later, tooLate, earlier] }).conversas[0]?.booking_id
    ).toBe(10);
    const coded = { booking_id: 40, createdAt: min(800), phones: [], codes: ['CCC4'], value: 4 };
    expect(analyzeFunnel({ ...base, bookings: [earlier, coded] }).conversas[0]?.booking_id).toBe(
      40
    );
    expect(analyzeFunnel({ ...base, bookings: [tooLate] }).total.reservas).toBe(0);
  });
});

describe('dados para importar a reserva no Google Ads', () => {
  it('leva gclid e criação da reserva em -03:00 só quando a conversa virou reserva', () => {
    const pago: WhatsAppClick = {
      ...click('GC72', min(0), 'hrp_regional'),
      origem: { source: 'google', medium: 'cpc', campaign: 'hrp_regional', gclid: 'Cj0KCQ-teste' },
    };
    const semReserva: WhatsAppClick = {
      ...click('GC34', min(0), 'hrp_regional'),
      origem: { source: 'google', medium: 'cpc', gclid: 'Cj0KCQ-outro' },
    };
    const r = analyzeFunnel({
      clicks: [pago, semReserva],
      clicksByCode: { GC72: pago, GC34: semReserva },
      messages: [
        msg('a@lid', min(1), false, 'Código: S-GC72'),
        msg('b@lid', min(2), false, 'Código: S-GC34'),
      ],
      knownChats: new Set(),
      bookings: [{ booking_id: 77, createdAt: min(40), phones: [], codes: ['GC72'], value: 400 }],
    });
    const comReserva = r.conversas.find((c) => c.code === 'S-GC72');
    expect(comReserva).toMatchObject({
      booking_id: 77,
      booking_value: 400,
      gclid: 'Cj0KCQ-teste',
      booking_created_at: '2026-10-20T09:40:00-03:00',
    });
    expect(r.conversas.find((c) => c.code === 'S-GC34')).toMatchObject({
      booking_id: null,
      gclid: null,
      booking_created_at: null,
    });
  });

  it('formata no horário de Brasília', () => {
    expect(toBrasiliaIso(Date.parse('2026-10-27T19:40:00Z'))).toBe('2026-10-27T16:40:00-03:00');
    expect(toBrasiliaIso(Date.parse('2026-10-28T02:10:05Z'))).toBe('2026-10-27T23:10:05-03:00');
  });
});
