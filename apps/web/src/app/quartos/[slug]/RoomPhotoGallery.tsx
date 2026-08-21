'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function RoomPhotoGallery({ images, name }: { images: string[]; name: string }) {
  const [photoIdx, setPhotoIdx] = useState(0);

  const prevPhoto = () => setPhotoIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextPhoto = () => setPhotoIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 0) {
    return (
      <div className="flex h-[440px] w-full items-center justify-center rounded-t-2xl bg-beige-100">
        <p className="text-beige-500">Sem fotos disponíveis</p>
      </div>
    );
  }

  return (
    <div>
      {/* Main photo */}
      <div className="relative h-[440px] w-full overflow-hidden rounded-t-2xl bg-beige-100">
        <Image
          src={images[photoIdx] ?? ''}
          alt={`${name} ${photoIdx + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 900px"
          unoptimized={images[photoIdx]?.startsWith('http') ?? false}
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/60 text-white backdrop-blur-sm transition-colors hover:bg-brand-black/80"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-black/60 text-white backdrop-blur-sm transition-colors hover:bg-brand-black/80"
              aria-label="Próxima foto"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {photoIdx + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-white px-4 py-3 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setPhotoIdx(i)}
              className={`relative h-[52px] w-[72px] flex-none overflow-hidden rounded-md transition-all ${
                i === photoIdx
                  ? 'ring-2 ring-brand-gold ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${name} miniatura ${i + 1}`}
                fill
                className="object-cover"
                sizes="72px"
                unoptimized={img.startsWith('http')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
