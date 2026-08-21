import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4 py-24 text-center">
      <h1 className="font-display text-6xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-white/50">Página não encontrada</p>
      <Link
        href="/"
        className="mt-8 rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
