import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppMessage,
  extractWhatsAppCodes,
  generateWhatsAppCode,
  isWhatsAppCode,
} from '@hotel-paraiso/tracking';
import {
  getWhatsAppClicks,
  isTestClick,
  listWhatsAppClicksSince,
  parseWhatsAppClick,
  recordWhatsAppClick,
} from '../lib/whatsapp-leads';
import { origemDe } from '../lib/whatsapp-funnel';

/** ADR-0012 — código do WhatsApp do clique até a observação da reserva na Artax. */

describe('código do WhatsApp', () => {
  it('gera 4 caracteres sem letras ambíguas', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateWhatsAppCode();
      expect(code).toMatch(/^[A-Z2-9]{4}$/);
      expect(code).not.toMatch(/[01OIL]/);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/); // regex combinada com o time de mídia
      expect(isWhatsAppCode(code)).toBe(true);
    }
  });

  it('monta a mensagem padrão sem quarto escolhido', () => {
    expect(buildWhatsAppMessage('7KQ3')).toBe(
      'Olá! Vim pelo site do Hotel Paraíso e quero fazer uma reserva. Código: S-7KQ3'
    );
  });

  it('monta a mensagem com quarto, datas e hóspedes', () => {
    const booking = { roomName: 'Luxo', checkin: '2026-11-24', checkout: '2026-11-26', guests: 2 };
    expect(buildWhatsAppMessage('7KQ3', booking)).toBe(
      'Olá! Vim pelo site do Hotel Paraíso e quero reservar o quarto Luxo, de 24/11 a 26/11, para 2 hóspedes. Código: S-7KQ3'
    );
    expect(buildWhatsAppMessage('7KQ3', { ...booking, guests: 1 })).toContain('para 1 hóspede.');
  });

  it('acha o código na observação mesmo digitado à mão', () => {
    expect(extractWhatsAppCodes('Cliente WhatsApp S-7KQ3 pediu andar alto')).toEqual(['7KQ3']);
    expect(extractWhatsAppCodes('obs: s-7kq3')).toEqual(['7KQ3']);
    expect(extractWhatsAppCodes('codigo S 7KQ3')).toEqual(['7KQ3']);
    expect(extractWhatsAppCodes('S7KQ3')).toEqual(['7KQ3']);
  });

  it('não confunde texto comum ou telefone com código', () => {
    expect(extractWhatsAppCodes('Non-smoking')).toEqual([]);
    expect(extractWhatsAppCodes('Suite S-1234')).toEqual([]); // 1 é ambíguo, não existe
    expect(extractWhatsAppCodes('S-7KQ3X')).toEqual([]);
    expect(extractWhatsAppCodes(undefined)).toEqual([]);
  });
});

describe('registro do clique', () => {
  it('descarta campos com tipo errado sem perder o clique', () => {
    const click = parseWhatsAppClick({
      wa_code: 'AB23',
      guests: 999,
      origem: 'lixo',
      room_slug: 5,
    });
    expect(click).toMatchObject({ code: 'AB23', origem: {} });
    expect(click?.guests).toBeUndefined();
    expect(click?.room_slug).toBeUndefined();
  });

  it('recusa evento sem código válido', () => {
    expect(parseWhatsAppClick({ event: 'whatsapp_clicked' })).toBeNull();
    expect(parseWhatsAppClick({ wa_code: 'O0I1' })).toBeNull();
  });

  it('guarda só campos conhecidos, com o caminho da página sem query', () => {
    const click = parseWhatsAppClick({
      wa_code: '7kq3',
      page_url: 'https://hotelparaiso.moreirads.cloud/reservar?gclid=abc&email=x@y.z',
      room_slug: 'luxo',
      checkin: '2026-11-24',
      checkout: 'amanhã',
      guests: 2,
      guest_name: 'não deve passar',
      origem: { source: 'google', medium: 'cpc', campaign: 'hrp_regional', gclid: 'abc' },
    });
    expect(click).toMatchObject({
      code: '7KQ3',
      page: '/reservar',
      room_slug: 'luxo',
      checkin: '2026-11-24',
      guests: 2,
      origem: { campaign: 'hrp_regional', gclid: 'abc' },
    });
    expect(click?.checkout).toBeUndefined();
    expect(JSON.stringify(click)).not.toContain('não deve passar');
  });

  it('não sobrescreve um código já gravado (sem Redis, modo local)', async () => {
    const first = parseWhatsAppClick({ wa_code: 'ZZ22', room_slug: 'luxo', origem: {} });
    const second = parseWhatsAppClick({ wa_code: 'ZZ22', room_slug: 'master', origem: {} });
    expect(first && second).toBeTruthy();
    if (!first || !second) return;
    await recordWhatsAppClick(first);
    await recordWhatsAppClick(second);
    expect((await getWhatsAppClicks(['ZZ22']))['ZZ22']?.room_slug).toBe('luxo');
    const recent = await listWhatsAppClicksSince(Date.now() - 60_000);
    expect(recent.map((c) => c.code)).toContain('ZZ22');
  });
});

describe('origem do relatório', () => {
  it('separa as campanhas do Google Ads, orgânico e direto', () => {
    expect(origemDe({ source: 'google', medium: 'cpc', campaign: 'hrp_regional' })).toBe(
      'hrp_regional'
    );
    expect(origemDe({ source: 'google', medium: 'cpc', campaign: 'hrp_local' })).toBe('hrp_local');
    expect(origemDe({ source: 'google', medium: 'organic' })).toBe('google_organico');
    expect(origemDe({ source: '(direct)', medium: '(none)' })).toBe('direto');
    expect(origemDe(undefined)).toBe('direto');
    expect(origemDe({ source: 'instagram', medium: 'social' })).toBe('outros');
  });
});

describe('cliques de teste', () => {
  const base = { code: 'S-AAAA', at: '2026-10-27T00:00:00.000Z', page: '/' };

  it('reconhece utm_source=teste-claude, sem diferenciar maiúsculas', () => {
    expect(isTestClick({ ...base, origem: { source: 'teste-claude' } })).toBe(true);
    expect(isTestClick({ ...base, origem: { source: 'Teste-Claude' } })).toBe(true);
    expect(isTestClick({ ...base, origem: { source: 'google', medium: 'cpc' } })).toBe(false);
    expect(isTestClick({ ...base, origem: {} })).toBe(false);
  });
});
