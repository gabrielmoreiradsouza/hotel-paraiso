'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Coffee, CalendarX2 } from 'lucide-react';

export function HomeCta() {
  const t = useTranslations('cta');

  return (
    <section className="bg-brand-black py-16 text-center sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="font-display text-3xl font-bold text-brand-white sm:text-4xl">
          {t('title')}
        </h2>
        <p className="mt-2 font-display text-xl text-brand-gold">{t('highlight')}</p>
        <p className="mt-4 text-beige-400">{t('subtitle')}</p>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-beige-300">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-gold" strokeWidth={1.5} />
            Melhor preço direto
          </span>
          <span className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-brand-gold" strokeWidth={1.5} />
            Café da manhã incluso
          </span>
          <span className="flex items-center gap-2">
            <CalendarX2 className="h-4 w-4 text-brand-gold" strokeWidth={1.5} />
            Cancelamento gratuito
          </span>
        </div>

        <a
          href="/reservar"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
        >
          {t('button')}
        </a>
      </div>
    </section>
  );
}
