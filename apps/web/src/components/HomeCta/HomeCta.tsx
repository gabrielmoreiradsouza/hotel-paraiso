'use client';

import { useTranslations } from 'next-intl';

export function HomeCta() {
  const t = useTranslations('cta');

  return (
    <section className="bg-brand-black py-16 text-center sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-display text-3xl font-bold text-brand-white sm:text-4xl">
          {t('title')} <span className="text-brand-gold">{t('highlight')}</span>
        </h2>
        <p className="mt-4 text-beige-400">{t('subtitle')}</p>
        <a
          href="#quartos"
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
        >
          {t('button')}
        </a>
      </div>
    </section>
  );
}
