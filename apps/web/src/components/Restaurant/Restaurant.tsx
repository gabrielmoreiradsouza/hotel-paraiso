'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { UtensilsCrossed, Clock, Coffee } from 'lucide-react';

export function Restaurant() {
  const t = useTranslations('restaurant');

  return (
    <section id="restaurante" className="bg-brand-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Images */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/restaurant/prato-1.jpg"
                alt="Gastronomia — Bife com batata"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/restaurant/prato-2.jpg"
                alt="Gastronomia mineira"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/common/salao-cafe.jpg"
                alt="Café da manhã — Salão"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/restaurant/salao-cafe-3.jpg"
                alt="Café da manhã — Mesa"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-beige-700 leading-relaxed">{t('description')}</p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-brand-gold">
                  <Coffee className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-brand-black">{t('breakfast')}</p>
                  <p className="text-sm text-beige-700">{t('breakfastTime')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-brand-gold">
                  <UtensilsCrossed className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-brand-black">{t('dinner')}</p>
                  <p className="text-sm text-beige-700">{t('dinnerTime')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-brand-gold">
                  <Clock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-brand-black">{t('included')}</p>
                  <p className="text-sm text-beige-700">{t('includedDesc')}</p>
                </div>
              </div>
            </div>

            <a
              href="/galeria"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-gold-700"
            >
              {t('gallery')} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
