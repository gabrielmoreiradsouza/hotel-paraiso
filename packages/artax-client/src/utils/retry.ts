interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const config = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`[artax] tentativa ${attempt}/${config.maxAttempts} falhou:`, error);

      if (attempt === config.maxAttempts) break;

      // DR-001: nunca fazer retry de 4xx — 429 incluído.
      // A Artax devolve 429 exatamente quando estamos encostando no limite que desativa
      // a chave permanentemente (102 req/60s). Insistir nesse caso acelera o dano em vez
      // de contorná-lo: 1 chamada lógica viraria 3 requests reais no pior momento possível.
      if (error instanceof ArtaxApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      const delay = Math.min(config.baseDelayMs * 2 ** (attempt - 1), config.maxDelayMs);
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }

  throw lastError;
}

export class ArtaxApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ArtaxApiError';
  }
}
