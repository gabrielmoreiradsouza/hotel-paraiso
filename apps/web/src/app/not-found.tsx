'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 pt-16 text-center">
      <h1 className="font-display text-6xl font-bold text-brand-black">{t('title')}</h1>
      <p className="mt-4 text-lg text-beige-700">{t('message')}</p>
      <Link
        href="/"
        className="mt-8 rounded-sm bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
      >
        {t('back')}
      </Link>
    </main>
  );
}
