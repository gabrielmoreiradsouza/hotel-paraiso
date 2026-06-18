'use client';

import { useState } from 'react';
import Image from 'next/image';

const categories = [
  { id: 'all', label: 'Todas' },
  { id: 'rooms', label: 'Quartos' },
  { id: 'common', label: 'Áreas comuns' },
];

const photos = [
  // Rooms
  { src: '/images/rooms/master.jpg', alt: 'Suíte Master', category: 'rooms' },
  { src: '/images/rooms/master-2.jpg', alt: 'Suíte Master — Hidromassagem', category: 'rooms' },
  { src: '/images/rooms/master-3.jpg', alt: 'Suíte Master — Vista', category: 'rooms' },
  { src: '/images/rooms/master-bath.jpg', alt: 'Suíte Master — Banheiro', category: 'rooms' },
  { src: '/images/rooms/luxo.jpg', alt: 'Quarto Luxo', category: 'rooms' },
  { src: '/images/rooms/luxo-2.jpg', alt: 'Quarto Luxo — Detalhe', category: 'rooms' },
  { src: '/images/rooms/luxo-bath.jpg', alt: 'Quarto Luxo — Banheiro', category: 'rooms' },
  { src: '/images/rooms/standard.jpg', alt: 'Quarto Standard', category: 'rooms' },
  { src: '/images/rooms/standard-2.jpg', alt: 'Quarto Standard — Detalhe', category: 'rooms' },
  { src: '/images/rooms/standard-bath.jpg', alt: 'Quarto Standard — Banheiro', category: 'rooms' },
  // Common areas
  { src: '/images/common/recepcao.jpg', alt: 'Recepção', category: 'common' },
  { src: '/images/common/restaurante.jpg', alt: 'Restaurante — Salão de café', category: 'common' },
  { src: '/images/common/hero.jpg', alt: 'Gastronomia', category: 'common' },
];

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === 'all' ? photos : photos.filter((p) => p.category === activeCategory);

  return (
    <main className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">Galeria</h1>
          <p className="mt-2 text-beige-700">Conheça nossos espaços e acomodações</p>
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
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-3xl text-brand-white hover:text-brand-gold"
              onClick={() => setLightboxIndex(null)}
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
                  setLightboxIndex(lightboxIndex - 1);
                }}
              >
                ‹
              </button>
            )}

            {/* Image */}
            <div
              className="relative max-h-[80vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
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
                  setLightboxIndex(lightboxIndex + 1);
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
