'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wifi,
  Car,
  UtensilsCrossed,
  Calendar,
  Zap,
  PawPrint,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="bg-brand-black py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
          {t('subtitle') && <p className="mt-4 text-white/60">{t('subtitle')}</p>}
        </div>

        <div className="relative">
          {/* Prev button */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-brand-black/80 text-white/60 backdrop-blur transition-colors hover:border-brand-gold hover:text-brand-gold sm:flex"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
          >
            {featureKeys.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="flex-none w-[220px] flex flex-col items-center text-center gap-4 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{t(feature.key)}</h3>
                    <p className="mt-1 text-xs text-white/45">{t(`${feature.key}Desc`)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-brand-black/80 text-white/60 backdrop-blur transition-colors hover:border-brand-gold hover:text-brand-gold sm:flex"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
