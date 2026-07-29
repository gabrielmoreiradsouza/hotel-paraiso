'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

const faqKeys = [
  'checkinOut',
  'breakfast',
  'cancellation',
  'parking',
  'pets',
  'payment',
  'ev',
  'events',
] as const;

export function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-brand-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-beige-700">{t('subtitle')}</p>
        </div>

        <div className="divide-y divide-beige-200 rounded-lg border border-beige-200">
          {faqKeys.map((key, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-beige-50"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4 font-display text-base font-semibold text-brand-black sm:text-lg">
                    {t(`${key}Q`)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-beige-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-40 pb-5' : 'max-h-0'}`}
                >
                  <p className="px-6 text-sm leading-relaxed text-beige-700">{t(`${key}A`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
