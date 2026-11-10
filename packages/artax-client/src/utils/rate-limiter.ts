/**
 * DR-001: a Artax DESATIVA a chave permanentemente em 102 req/60s.
 *
 * A versão anterior verificava e registrava sem exclusão mútua: quando várias chamadas
 * simultâneas encontravam a janela cheia, todas calculavam a mesma espera, acordavam juntas
 * e saíam de uma vez — o teto virava "50 + quantas estivessem esperando". Agora cada
 * pedido entra numa fila única e só sai quando há vaga real na janela, um por vez.
 *
 * Quem chama deve pedir vaga para CADA requisição HTTP, inclusive novas tentativas: uma
 * chamada lógica com retry são até 3 requisições reais.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private queue: Promise<void> = Promise.resolve();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 30, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Espera uma vaga na janela. Pedidos são atendidos em ordem de chegada. */
  waitIfNeeded(): Promise<void> {
    const turn = this.queue.then(() => this.acquire());
    // A fila segue mesmo que um pedido falhe (não deve, mas a fila não pode travar).
    this.queue = turn.catch((err: unknown) => {
      console.error('[artax] fila do rate limiter: pedido falhou', err);
    });
    return turn;
  }

  /** Requisições registradas na janela atual (para testes e diagnóstico). */
  get inWindow(): number {
    const now = Date.now();
    return this.timestamps.filter((t) => now - t < this.windowMs).length;
  }

  private async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(now);
        return;
      }
      const oldest = this.timestamps[0] ?? now;
      await new Promise((resolve) => setTimeout(resolve, this.windowMs - (now - oldest) + 100));
    }
  }
}
