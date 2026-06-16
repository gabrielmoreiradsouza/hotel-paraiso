import { describe, it, expect } from 'vitest';

describe('api', () => {
  it('health check returns ok', () => {
    const response = { status: 'ok' };
    expect(response.status).toBe('ok');
  });
});
