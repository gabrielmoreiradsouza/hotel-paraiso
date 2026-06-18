'use client';

import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/common/recepcao.jpg"
          alt="Hotel e Restaurante Paraíso — Recepção"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/60 via-brand-black/40 to-brand-black/80" />
      </div>

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
          Hotel e Restaurante
          <br />
          <span className="text-brand-gold">Paraíso</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-beige-200 sm:text-xl">
          Conforto e sofisticação em Ponte Nova, MG.
          <br className="hidden sm:block" /> Sua experiência começa aqui.
        </p>

        <a
          href="#quartos"
          className="mt-10 inline-flex items-center gap-2 rounded-sm bg-brand-gold px-8 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
        >
          Reserve agora
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
