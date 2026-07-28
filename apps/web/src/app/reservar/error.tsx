'use client';

export default function Error({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
      <h1 className="font-display text-4xl font-bold text-brand-black">Ops!</h1>
      <p className="mt-4 text-beige-700">Erro ao processar sua reserva.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
      >
        Tentar novamente
      </button>
    </main>
  );
}
