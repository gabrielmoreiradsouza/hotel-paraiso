'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { trackGalleryOpened } from '@hotel-paraiso/tracking';

type Photo = {
  src: string;
  alt: string;
  category: 'rooms' | 'common' | 'restaurant';
};

/* ── Parallax break definitions ── */
const parallaxBreaks = [
  {
    afterIndex: 9,
    image: '/images/common/restaurante.jpg',
    text: 'Gastronomia Mineira',
  },
  {
    afterIndex: 21,
    image: '/images/common/fachada.jpg',
    text: 'Sua Próxima Estadia',
  },
  {
    afterIndex: 33,
    image: '/images/common/pista-eventos.jpg',
    text: 'Eventos & Celebrações',
  },
];

export function GalleryClient({ photos }: { photos: Photo[] }) {
  const t = useTranslations('gallery');
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackGalleryOpened();
      tracked.current = true;
    }
  }, []);

  const categories = [
    { id: 'all', label: t('all') },
    { id: 'rooms', label: t('roomsCat') },
    { id: 'common', label: t('commonCat') },
    { id: 'restaurant', label: t('restaurantCat') },
  ];

  const filtered =
    activeCategory === 'all' ? photos : photos.filter((p) => p.category === activeCategory);

  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev < filtered.length - 1 ? prev + 1 : prev));
  }, [filtered.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Keyboard support
  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lightboxIndex]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? 0;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  }

  const currentPhoto = lightboxIndex !== null ? (filtered[lightboxIndex] ?? null) : null;

  /* ── Thumbnail strip helpers ── */
  const thumbCount = 9;
  const thumbHalf = Math.floor(thumbCount / 2);
  const visibleThumbs = useMemo(() => {
    if (lightboxIndex === null) return [];
    const total = filtered.length;
    let start = Math.max(0, lightboxIndex - thumbHalf);
    const end = Math.min(total, start + thumbCount);
    if (end - start < thumbCount) start = Math.max(0, end - thumbCount);
    return filtered.slice(start, end).map((p, i) => ({ ...p, realIndex: start + i }));
  }, [lightboxIndex, filtered, thumbHalf]);

  /* ── Build masonry items with parallax breaks ── */
  const masonryContent = useMemo(() => {
    const items: React.ReactNode[] = [];
    const showBreaks = activeCategory === 'all';

    filtered.forEach((photo, i) => {
      items.push(
        <button
          key={photo.src}
          type="button"
          onClick={() => setLightboxIndex(i)}
          className="group relative mb-2 break-inside-avoid overflow-hidden rounded cursor-pointer"
          style={{ animationDelay: `${(i % 20) * 60}ms` }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            width={600}
            height={400}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={photo.src.startsWith('http')}
          />
          <div className="absolute inset-0 bg-brand-black/0 transition-colors duration-300 group-hover:bg-brand-black/30" />
          <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 bg-gradient-to-t from-brand-black/70 to-transparent">
            <p className="text-white text-xs leading-snug">{photo.alt}</p>
          </div>
        </button>
      );

      // Insert parallax break after certain indices (only for "all" tab)
      if (showBreaks) {
        const breakDef = parallaxBreaks.find((b) => b.afterIndex === i);
        if (breakDef) {
          items.push(
            <div
              key={`break-${i}`}
              className="mb-2 break-inside-avoid col-span-full"
              style={{ columnSpan: 'all' } as React.CSSProperties}
            >
              <div
                className="relative h-[250px] md:h-[300px] bg-fixed bg-cover bg-center rounded overflow-hidden"
                style={{ backgroundImage: `url(${breakDef.image})` }}
              >
                <div className="absolute inset-0 bg-brand-black/60" />
                <div className="relative z-10 flex items-center justify-center h-full">
                  <p className="font-display text-2xl md:text-3xl text-white font-semibold tracking-wide">
                    {breakDef.text}
                  </p>
                </div>
              </div>
            </div>
          );
        }
      }
    });

    return items;
  }, [filtered, activeCategory]);

  return (
    <main className="bg-brand-black min-h-screen">
      {/* ── Hero ── */}
      <section className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <div
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/common/fachada.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-md">{t('subtitle')}</p>
        </div>
      </section>

      {/* ── Sticky filter tabs ── */}
      <div className="sticky top-[54px] z-40 bg-brand-black/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 py-3 flex justify-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setLightboxIndex(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Masonry photo grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-2">{masonryContent}</div>
      </div>

      {/* ── Bottom CTA ── */}
      <section className="relative h-[300px] md:h-[350px] overflow-hidden">
        <div
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/common/fachada-2.jpg)' }}
        />
        <div className="absolute inset-0 bg-brand-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <p className="font-display text-2xl sm:text-3xl text-white font-semibold mb-2">
            Gostou do que viu?
          </p>
          <p className="text-white/60 mb-6 text-sm sm:text-base">
            Reserve direto conosco e garanta a melhor tarifa
          </p>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-black font-semibold px-8 py-3 rounded-full hover:bg-brand-gold/90 transition-colors shadow-lg shadow-brand-gold/20"
          >
            Reserve agora
          </Link>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-black/92 backdrop-blur-lg animate-fade-in"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-brand-gold transition-colors text-2xl"
            onClick={closeLightbox}
            aria-label="Fechar"
          >
            &times;
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {filtered.length}
          </div>

          {/* Prev arrow */}
          {lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl hover:bg-white/20 hover:text-brand-gold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Anterior"
            >
              &#8249;
            </button>
          )}

          {/* Main image with crossfade */}
          <div
            className="relative flex-1 flex items-center justify-center w-full max-w-5xl px-16 py-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentPhoto && (
              <Image
                key={currentPhoto.src}
                src={currentPhoto.src}
                alt={currentPhoto.alt}
                width={1200}
                height={800}
                className="max-h-[65vh] w-auto object-contain rounded animate-crossfade"
                unoptimized={currentPhoto.src.startsWith('http')}
                priority
              />
            )}
          </div>

          {/* Caption */}
          <p className="text-white/80 text-sm mb-3 text-center px-4">{currentPhoto?.alt ?? ''}</p>

          {/* Thumbnail strip */}
          <div
            className="flex items-center justify-center gap-1.5 px-4 pb-4 overflow-x-auto max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {visibleThumbs.map((thumb) => (
              <button
                key={thumb.src}
                type="button"
                onClick={() => setLightboxIndex(thumb.realIndex)}
                className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden transition-all duration-200 ${
                  thumb.realIndex === lightboxIndex
                    ? 'ring-2 ring-brand-gold ring-offset-1 ring-offset-brand-black scale-110'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <Image
                  src={thumb.src}
                  alt={thumb.alt}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={thumb.src.startsWith('http')}
                />
              </button>
            ))}
          </div>

          {/* Next arrow */}
          {lightboxIndex < filtered.length - 1 && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl hover:bg-white/20 hover:text-brand-gold transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Próxima"
            >
              &#8250;
            </button>
          )}
        </div>
      )}
    </main>
  );
}
