'use client';

import { useTranslations } from 'next-intl';

const featureKeys = [
  { icon: '\u{1F4F6}', key: 'wifi' },
  { icon: '\u{1F17F}\uFE0F', key: 'parking' },
  { icon: '\u{1F37D}\uFE0F', key: 'restaurant' },
  { icon: '\u{1F3DF}\uFE0F', key: 'events' },
  { icon: '\u26A1', key: 'charger' },
  { icon: '\u{1F43E}', key: 'pet' },
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
          <p className="mt-4 text-beige-700">{t('subtitle')}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="flex items-start gap-4 rounded-sm bg-brand-white p-6 shadow-sm"
            >
              <span className="text-3xl" role="img" aria-label={t(feature.key)}>
                {feature.icon}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-brand-black">
                  {t(feature.key)}
                </h3>
                <p className="mt-1 text-sm text-beige-700">{t(`${feature.key}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
