import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Wifi, Car, UtensilsCrossed, Zap, PawPrint, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre — Hotel e Restaurante Paraíso',
  description:
    'Conheça o Hotel e Restaurante Paraíso em Ponte Nova, MG. Tradição, conforto e gastronomia mineira para viajantes corporativos e famílias.',
};

const highlights = [
  { icon: UtensilsCrossed, label: 'Restaurante próprio' },
  { icon: Car, label: 'Estacionamento grátis' },
  { icon: Wifi, label: 'Wi-Fi rápido' },
  { icon: Zap, label: 'Carregador veicular' },
  { icon: PawPrint, label: 'Pet friendly' },
  { icon: Clock, label: 'Recepção 24h' },
];

export default async function SobrePage() {
  const t = await getTranslations('about');

  return (
    <main className="pt-24 pb-16">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <Image
          src="/images/common/recepcao.jpg"
          alt="Recepção do Hotel Paraíso"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-brand-black/50" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <h1 className="font-display text-4xl font-bold text-brand-white sm:text-5xl">
            {t('title')}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        {/* Section 1: Text + Stats side by side */}
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="font-display text-2xl font-bold text-brand-black sm:text-3xl">
              {t('tradition')}
            </h2>
            <p className="mt-4 text-beige-800 leading-relaxed">{t('p1')}</p>
            <p className="mt-4 text-beige-800 leading-relaxed">{t('p2')}</p>
          </div>
          <div className="flex flex-col justify-center lg:col-span-2">
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: '3', label: t('roomCategories') },
                { value: '24h', label: t('receptionLabel') },
                { value: '150km', label: t('fromBH') },
                { value: '\u2605', label: t('gastronomy') },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg bg-beige-50 p-5 text-center">
                  <div className="font-display text-2xl font-bold text-brand-gold">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-beige-700">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highlights strip */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {highlights.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-lg border border-beige-200 bg-brand-white p-4 text-center"
            >
              <Icon className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
              <span className="text-xs font-medium text-beige-800">{label}</span>
            </div>
          ))}
        </div>

        {/* Section 2: Infrastructure */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-brand-black sm:text-3xl">
            {t('infra')}
          </h2>
          <p className="mt-4 max-w-3xl text-beige-800 leading-relaxed">{t('p3')}</p>
        </div>

        {/* Section 3: Location */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-brand-black sm:text-3xl">
            {t('location')}
          </h2>
          <p className="mt-4 max-w-3xl text-beige-800 leading-relaxed">{t('p4')}</p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/reservar"
            className="inline-block rounded-md bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            {t('bookCta')}
          </Link>
        </div>
      </section>
    </main>
  );
}
