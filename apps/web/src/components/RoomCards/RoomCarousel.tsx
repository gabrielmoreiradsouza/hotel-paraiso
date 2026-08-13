'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { RoomCardData } from './RoomCards';

/* ------------------------------------------------------------------ */
/*  Room Detail Modal                                                  */
/* ------------------------------------------------------------------ */

function RoomDetailModal({ room, onClose }: { room: RoomCardData; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const prevPhoto = () => setPhotoIdx((i) => (i === 0 ? room.images.length - 1 : i - 1));
  const nextPhoto = () => setPhotoIdx((i) => (i === room.images.length - 1 ? 0 : i + 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-black/85 backdrop-blur-xl"
      style={{ animation: 'modalFadeIn 300ms ease-out both' }}
      onClick={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className="relative mx-4 w-full max-w-[900px] overflow-y-auto overflow-x-hidden rounded-xl bg-brand-white shadow-2xl max-h-[90vh]"
        style={{ animation: 'modalSlideUp 300ms ease-out both' }}
      >
        {/* Photo section */}
        <div className="relative h-[340px] w-full bg-beige-100">
          <Image
            src={room.images[photoIdx] ?? room.image}
            alt={`${room.name} ${photoIdx + 1}`}
            fill
            className="object-cover"
            sizes="900px"
            unoptimized={(room.images[photoIdx] ?? room.image).startsWith('http')}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-black/60 text-white backdrop-blur-sm transition-colors hover:bg-brand-black/80"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          {/* Photo navigation */}
          {room.images.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/60 text-white backdrop-blur-sm transition-colors hover:bg-brand-black/80"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/60 text-white backdrop-blur-sm transition-colors hover:bg-brand-black/80"
                aria-label="Próxima foto"
              >
                <ChevronRight size={18} />
              </button>
              <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {photoIdx + 1}/{room.images.length}
              </span>
            </>
          )}
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-bold text-brand-black sm:text-3xl">
                {room.name}
              </h3>
              <p className="mt-1 text-sm text-beige-700">
                {room.capacity} · {room.size}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-display text-2xl font-bold text-gold-700">{room.price}</span>
              <span className="block text-xs text-beige-600">/ noite</span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-5 leading-relaxed text-beige-800">{room.longDescription}</p>

          {/* Amenities grid */}
          <div className="mt-8">
            <h4 className="font-display text-lg font-bold text-brand-black">
              O que este quarto oferece
            </h4>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {room.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2.5 text-sm text-beige-800">
                  <span className="text-brand-gold">✓</span>
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/reservar?room=${room.slug}`}
              className="flex-1 rounded-lg bg-brand-gold py-3.5 text-center text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
            >
              Reservar agora
            </a>
            <a
              href={`/quartos/${room.slug}`}
              className="flex-1 rounded-lg border border-beige-300 py-3.5 text-center text-sm font-semibold text-beige-800 transition-colors hover:border-beige-400 hover:bg-beige-50"
            >
              Ver página completa →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Room Card                                                          */
/* ------------------------------------------------------------------ */

function RoomCard({ room, onClick }: { room: RoomCardData; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="group relative flex-none w-[340px] cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl scroll-snap-align-start"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Image */}
      <div className="relative h-[420px] w-full overflow-hidden">
        <Image
          src={room.image}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="340px"
          unoptimized={room.image.startsWith('http')}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/95 via-brand-black/60 to-transparent" />

        {/* Info overlaid at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-xl font-bold text-white">{room.name}</h3>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-display text-lg font-bold text-brand-gold">{room.price}</span>
            <span className="text-xs text-white/70">{room.capacity}</span>
          </div>

          {/* Hover reveal: description + amenities + CTA */}
          <div className="mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-[300px] group-hover:opacity-100">
            <p className="text-sm leading-relaxed text-white/80">{room.description}</p>

            {/* Amenity pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-white/90"
                >
                  {amenity}
                </span>
              ))}
            </div>

            {/* CTA */}
            <span className="mt-4 block w-full rounded-lg border border-brand-gold py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-black">
              Ver detalhes
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Carousel                                                           */
/* ------------------------------------------------------------------ */

export function RoomCarousel({
  rooms,
  title,
  subtitle,
  detailsLabel: _detailsLabel,
}: {
  rooms: RoomCardData[];
  title: string;
  subtitle: string;
  detailsLabel: string;
}) {
  const [selectedRoom, setSelectedRoom] = useState<RoomCardData | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const amount = 360;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <section id="quartos" className="bg-brand-black py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-10">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-beige-400">{subtitle}</p>
              <p className="hidden text-sm text-white/40 sm:block">Arraste para explorar →</p>
            </div>
          </div>

          {/* Carousel wrapper */}
          <div className="relative">
            {/* Prev arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute -left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/80 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-brand-black sm:-left-5"
                aria-label="Anterior"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Next arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute -right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/80 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-brand-black sm:-right-5"
                aria-label="Próximo"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Scrollable track */}
            <div
              ref={trackRef}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {rooms.map((room) => (
                <RoomCard key={room.slug} room={room} onClick={() => setSelectedRoom(room)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedRoom && (
        <RoomDetailModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </>
  );
}
