'use client';

import { useTranslations } from 'next-intl';
import { Wifi, Car, UtensilsCrossed, Calendar, Zap, PawPrint } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const featureKeys: { icon: LucideIcon; key: string }[] = [
  { icon: Wifi, key: 'wifi' },
  { icon: Car, key: 'parking' },
  { icon: UtensilsCrossed, key: 'restaurant' },
  { icon: Calendar, key: 'events' },
  { icon: Zap, key: 'charger' },
  { icon: PawPrint, key: 'pet' },
];

export function Features() {
  const t = useTranslations('features');

  return (
    <section className="bg-beige-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            {t('title')}
          </h2>
          {t('subtitle') && <p className="mt-4 text-beige-700">{t('subtitle')}</p>}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="flex items-start gap-4 rounded-lg bg-brand-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-brand-gold">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-brand-black">
                    {t(feature.key)}
                  </h3>
                  <p className="mt-1 text-sm text-beige-700">{t(`${feature.key}Desc`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
