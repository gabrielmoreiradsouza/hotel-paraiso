import { describe, it, expect, beforeAll } from 'vitest';
import { createHmac } from 'node:crypto';
import { createSessionToken, verifyAdminPassword, verifySessionToken } from '../lib/admin-session';

const SENHA = 'senha-de-teste-bem-longa';

/** Emite token assinado corretamente, mas com o payload que o teste quiser. */
function tokenComPayload(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${createHmac('sha256', SENHA).update(encoded).digest('base64url')}`;
}

beforeAll(() => {
  process.env['ADMIN_PASSWORD'] = SENHA;
});

describe('verifyAdminPassword', () => {
  it('aceita a senha correta', () => {
    expect(verifyAdminPassword(SENHA)).toBe(true);
  });

  it('recusa senha errada, prefixo correto e tipos não-string', () => {
    expect(verifyAdminPassword('senha-errada')).toBe(false);
    // Prefixo correto não pode passar — era o que a comparação `===` vazava por tempo.
    expect(verifyAdminPassword(SENHA.slice(0, -1))).toBe(false);
    expect(verifyAdminPassword('')).toBe(false);
    expect(verifyAdminPassword(null)).toBe(false);
    expect(verifyAdminPassword({ toString: () => SENHA })).toBe(false);
  });
});

describe('token de sessão', () => {
  it('emite token válido e o aceita de volta', () => {
    const token = createSessionToken();
    expect(token).toBeTruthy();
    expect(verifySessionToken(token ?? '')).toBe(true);
  });

  it('emite token DIFERENTE a cada login', () => {
    // O token antigo era HMAC(senha, "admin") — idêntico sempre, logo replayável para
    // sempre. Cada sessão precisa de identidade própria para poder ser revogada.
    expect(createSessionToken()).not.toBe(createSessionToken());
  });

  it('recusa token adulterado', () => {
    const token = createSessionToken() ?? '';
    const [payload, sig] = token.split('.');
    // Payload trocado, assinatura antiga.
    const forjado = `${Buffer.from(JSON.stringify({ sid: 'x', exp: Date.now() + 999999 })).toString('base64url')}.${sig}`;
    expect(verifySessionToken(forjado)).toBe(false);
    // Assinatura trocada, payload legítimo.
    expect(verifySessionToken(`${payload}.assinatura-falsa`)).toBe(false);
  });

  it('recusa token expirado mesmo com assinatura válida', () => {
    // Prova que a expiração é verificada no SERVIDOR. O maxAge do cookie é dica de
    // browser: um cliente que ignore o cookie ainda apresentaria o token.
    expect(verifySessionToken(tokenComPayload({ sid: 'antigo', exp: Date.now() - 1000 }))).toBe(
      false
    );
  });

  it('recusa token sem expiração declarada', () => {
    expect(verifySessionToken(tokenComPayload({ sid: 'sem-exp' }))).toBe(false);
  });

  it('recusa vazio, lixo e o formato antigo', () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken('')).toBe(false);
    expect(verifySessionToken('sem-ponto')).toBe(false);
    // Formato legado HMAC(senha,'admin') não é mais aceito.
    const legado = createHmac('sha256', SENHA).update('admin').digest('hex');
    expect(verifySessionToken(legado)).toBe(false);
  });
});
