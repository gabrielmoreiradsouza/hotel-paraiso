'use client';

import { useTranslations } from 'next-intl';
import { UtensilsCrossed, Clock, Coffee } from 'lucide-react';

export function Restaurant() {
  const t = useTranslations('restaurant');

  return (
    <section
      id="restaurante"
      className="relative py-16 sm:py-24 bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/restaurant/salao-buffet.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-brand-black/65" />

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Content */}
          <div>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
            <p className="mt-4 text-white/75 leading-relaxed">{t('description')}</p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                  <Coffee className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-white">{t('breakfast')}</p>
                  <p className="text-sm text-white/85">{t('breakfastTime')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                  <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-white">{t('dinner')}</p>
                  <p className="text-sm text-white/85">{t('dinnerTime')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                  <Clock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-white">{t('included')}</p>
                  <p className="text-sm text-white/85">{t('includedDesc')}</p>
                </div>
              </div>
            </div>

            <a
              href="/galeria"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-gold-400"
            >
              {t('gallery')} →
            </a>
          </div>

          {/* Right side — empty for visual balance */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}
