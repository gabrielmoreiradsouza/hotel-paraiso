import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../utils/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('starts in closed state', () => {
    const cb = new CircuitBreaker();
    expect(cb.currentState).toBe('closed');
    expect(cb.isOpen).toBe(false);
  });

  it('opens after reaching failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen).toBe(false);
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
    expect(cb.currentState).toBe('open');
  });

  it('resets to closed on success', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    expect(cb.currentState).toBe('closed');
    cb.recordFailure();
    expect(cb.isOpen).toBe(false);
  });

  it('transitions to half-open after reset timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });
    cb.recordFailure();
    expect(cb.isOpen).toBe(true);
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.isOpen).toBe(false);
    expect(cb.currentState).toBe('half-open');
  });
});
