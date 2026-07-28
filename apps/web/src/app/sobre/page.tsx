import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Sobre — Hotel e Restaurante Paraíso',
  description:
    'Conheça o Hotel e Restaurante Paraíso em Ponte Nova, MG. Tradição, conforto e gastronomia mineira para viajantes corporativos e famílias.',
};

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
        />
        <div className="absolute inset-0 bg-brand-black/50" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <h1 className="font-display text-4xl font-bold text-brand-white sm:text-5xl">
            {t('title')}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="prose prose-lg mx-auto">
          <h2 className="font-display text-2xl font-bold text-brand-black">{t('tradition')}</h2>
          <p className="mt-4 text-beige-800 leading-relaxed">{t('p1')}</p>

          <p className="mt-4 text-beige-800 leading-relaxed">{t('p2')}</p>

          <h2 className="mt-12 font-display text-2xl font-bold text-brand-black">{t('infra')}</h2>
          <p className="mt-4 text-beige-800 leading-relaxed">{t('p3')}</p>

          <h2 className="mt-12 font-display text-2xl font-bold text-brand-black">
            {t('location')}
          </h2>
          <p className="mt-4 text-beige-800 leading-relaxed">{t('p4')}</p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: '3', label: t('roomCategories') },
            { value: '24h', label: t('receptionLabel') },
            { value: '150km', label: t('fromBH') },
            { value: '\u2605', label: t('gastronomy') },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-brand-gold">{stat.value}</div>
              <div className="mt-1 text-sm text-beige-700">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/reservar"
            className="inline-block rounded-sm bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            {t('bookCta')}
          </Link>
        </div>
      </section>
    </main>
  );
}
