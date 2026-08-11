'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { trackGalleryOpened } from '@hotel-paraiso/tracking';

const photos = [
  // Rooms — Master (8)
  { src: '/images/rooms/master.jpg', alt: 'Suíte Master', category: 'rooms' },
  { src: '/images/rooms/master-2.jpg', alt: 'Suíte Master — Detalhe', category: 'rooms' },
  { src: '/images/rooms/master-3.jpg', alt: 'Suíte Master — Vista', category: 'rooms' },
  { src: '/images/rooms/master-bath.jpg', alt: 'Suíte Master — Banheiro', category: 'rooms' },
  { src: '/images/rooms/master-hidro.jpg', alt: 'Hidromassagem — Opcional', category: 'rooms' },
  {
    src: '/images/rooms/master-hidro-2.jpg',
    alt: 'Hidromassagem — Detalhe (opcional)',
    category: 'rooms',
  },
  { src: '/images/rooms/master-suite.jpg', alt: 'Suíte Master — Sala de estar', category: 'rooms' },
  { src: '/images/rooms/master-casal.jpg', alt: 'Suíte Master — Casal', category: 'rooms' },
  // Rooms — Luxo (7)
  { src: '/images/rooms/luxo.jpg', alt: 'Quarto Luxo', category: 'rooms' },
  { src: '/images/rooms/luxo-2.jpg', alt: 'Quarto Luxo — Detalhe', category: 'rooms' },
  { src: '/images/rooms/luxo-bath.jpg', alt: 'Quarto Luxo — Banheiro', category: 'rooms' },
  { src: '/images/rooms/luxo-triplo.jpg', alt: 'Quarto Luxo — Triplo', category: 'rooms' },
  { src: '/images/rooms/luxo-casal.jpg', alt: 'Quarto Luxo — Casal', category: 'rooms' },
  { src: '/images/rooms/luxo-casal-3.jpg', alt: 'Quarto Luxo — Casal vista', category: 'rooms' },
  { src: '/images/rooms/luxo-triplo-3.jpg', alt: 'Quarto Luxo — Triplo amplo', category: 'rooms' },
  // Rooms — Confort & Standard (6)
  { src: '/images/rooms/standard.jpg', alt: 'Quarto Confort / Standard', category: 'rooms' },
  { src: '/images/rooms/standard-2.jpg', alt: 'Quarto Standard — Detalhe', category: 'rooms' },
  { src: '/images/rooms/standard-bath.jpg', alt: 'Quarto Standard — Banheiro', category: 'rooms' },
  { src: '/images/rooms/standard-triplo.jpg', alt: 'Quarto Standard — Família', category: 'rooms' },
  {
    src: '/images/rooms/standard-triplo-2.jpg',
    alt: 'Quarto Standard — Família vista',
    category: 'rooms',
  },
  {
    src: '/images/rooms/standard-pet.jpg',
    alt: 'Quarto Standard — Pet Friendly',
    category: 'rooms',
  },
  // Common areas
  { src: '/images/common/fachada.jpg', alt: 'Fachada — Acesso ao hotel', category: 'common' },
  { src: '/images/common/fachada-2.jpg', alt: 'Fachada — Entrada', category: 'common' },
  { src: '/images/common/recepcao.jpg', alt: 'Recepção', category: 'common' },
  { src: '/images/common/recepcao-2.jpg', alt: 'Recepção — Lobby', category: 'common' },
  { src: '/images/common/salao-cafe.jpg', alt: 'Café da manhã — Salão', category: 'restaurant' },
  { src: '/images/common/pista-eventos.jpg', alt: 'Pista de eventos', category: 'common' },
  {
    src: '/images/common/carregador-veicular.jpg',
    alt: 'Carregador veicular elétrico',
    category: 'common',
  },
  // Restaurante & Eventos
  { src: '/images/common/restaurante.jpg', alt: 'Restaurante — Salão', category: 'restaurant' },
  { src: '/images/restaurant/salao-cafe-2.jpg', alt: 'Salão de café', category: 'restaurant' },
  {
    src: '/images/restaurant/salao-cafe-3.jpg',
    alt: 'Salão de café — Vista',
    category: 'restaurant',
  },
  { src: '/images/restaurant/prato-1.jpg', alt: 'Prato — Bife com batata', category: 'restaurant' },
  {
    src: '/images/restaurant/prato-2.jpg',
    alt: 'Prato — Gastronomia mineira',
    category: 'restaurant',
  },
  { src: '/images/common/hero.jpg', alt: 'Gastronomia', category: 'restaurant' },
  {
    src: '/images/restaurant/pista-foco-1.jpg',
    alt: 'Pista de eventos — Panorâmica',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-foco-2.jpg',
    alt: 'Pista de eventos — Detalhe',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-foco-3.jpg',
    alt: 'Pista de eventos — Estrutura',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-foco-4.jpg',
    alt: 'Pista de eventos — Vista lateral',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-2.jpg',
    alt: 'Pista de eventos — Ambiente',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-4.jpg',
    alt: 'Pista de eventos — Espaço',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-7.jpg',
    alt: 'Pista de eventos — Noturno',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-9.jpg',
    alt: 'Pista de eventos — Ampla',
    category: 'restaurant',
  },
  {
    src: '/images/restaurant/pista-10.jpg',
    alt: 'Pista de eventos — Cobertura',
    category: 'restaurant',
  },
];

export default function GaleriaPage() {
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

  return (
    <main className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-beige-700">{t('subtitle')}</p>
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-sm px-4 py-2 text-sm transition-colors ${
                activeCategory === cat.id
                  ? 'bg-brand-gold text-brand-black font-semibold'
                  : 'bg-beige-100 text-beige-700 hover:bg-beige-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-sm bg-beige-100"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-brand-black/0 transition-colors group-hover:bg-brand-black/20" />
            </button>
          ))}
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-4"
            onClick={closeLightbox}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-3xl text-brand-white hover:text-brand-gold"
              onClick={closeLightbox}
            >
              ×
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                className="absolute left-4 text-3xl text-brand-white hover:text-brand-gold"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                ‹
              </button>
            )}

            {/* Image */}
            <div
              className="relative max-h-[80vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={filtered[lightboxIndex]?.src ?? ''}
                alt={filtered[lightboxIndex]?.alt ?? ''}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto object-contain"
              />
              <p className="mt-2 text-center text-sm text-beige-300">
                {filtered[lightboxIndex]?.alt} — {lightboxIndex + 1}/{filtered.length}
              </p>
            </div>

            {/* Next */}
            {lightboxIndex < filtered.length - 1 && (
              <button
                type="button"
                className="absolute right-4 text-3xl text-brand-white hover:text-brand-gold"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                ›
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
