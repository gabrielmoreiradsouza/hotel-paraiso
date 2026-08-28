'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BookingWidget, BookingSentinel } from '@/components/BookingWidget/BookingWidget';

const heroImages = [
  { src: '/images/common/recepcao.jpg', alt: 'Hotel e Restaurante Paraíso — Recepção' },
  { src: '/images/common/fachada.jpg', alt: 'Hotel e Restaurante Paraíso — Fachada' },
  { src: '/images/common/recepcao-2.jpg', alt: 'Hotel e Restaurante Paraíso — Lobby' },
  { src: '/images/common/fachada-2.jpg', alt: 'Hotel e Restaurante Paraíso — Acesso' },
  { src: '/images/common/fachada-3.jpg', alt: 'Hotel e Restaurante Paraíso — Entrada' },
];

export function Hero() {
  const t = useTranslations('hero');
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % heroImages.length);
  }, []);

  // Preload next slide
  useEffect(() => {
    const nextIdx = (current + 1) % heroImages.length;
    setLoaded((prev) => new Set(prev).add(current).add(nextIdx));
  }, [current]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative h-dvh min-h-[600px] w-full overflow-hidden">
      {/* Only render loaded slides */}
      {heroImages.map((img, i) => {
        if (!loaded.has(i)) return null;
        return (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 640px) 640px, (max-width: 1080px) 1080px, 1280px"
              quality={75}
            />
          </div>
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black/80" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-brand-white">
        <Image
          src="/brand/logo-512.png"
          alt="HRP"
          width={120}
          height={120}
          className="mb-8 invert"
          priority
        />

        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          {t('title1')}
          <br />
          <span className="text-brand-gold">{t('title2')}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-beige-200 sm:text-xl">{t('subtitle')}</p>

        <a
          href="#quartos"
          className="mt-10 inline-flex items-center gap-2 rounded-sm bg-brand-gold px-8 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
        >
          {t('cta')}
        </a>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-20 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroImages.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-brand-gold' : 'w-1.5 bg-white/50'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce motion-reduce:animate-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      {/* Booking widget — glass state inside hero, docks on scroll */}
      <BookingWidget />
      <BookingSentinel />
    </section>
  );
}
