'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="bg-brand-black text-beige-100 border-t border-white/5">
      <div className="mx-auto max-w-[1440px] px-4 md:px-16 py-20">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/brand/logo-192.png"
                alt="Hotel Paraíso"
                width={48}
                height={48}
                className="invert"
              />
              <span className="font-display text-2xl font-medium text-beige-100">
                Hotel Paraíso
              </span>
            </div>
            <p className="text-sm text-beige-100/60 leading-relaxed">
              Hotel e Restaurante Paraíso. Conforto, gastronomia e hospitalidade mineira em Ponte
              Nova, MG.
            </p>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold mb-8">
                {t('hotel')}
              </h5>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#quartos"
                    className="text-beige-100/60 transition-colors hover:text-brand-gold"
                  >
                    {tNav('rooms')}
                  </a>
                </li>
                <li>
                  <a
                    href="/galeria"
                    className="text-beige-100/60 transition-colors hover:text-brand-gold"
                  >
                    {tNav('gallery')}
                  </a>
                </li>
                <li>
                  <a
                    href="/sobre"
                    className="text-beige-100/60 transition-colors hover:text-brand-gold"
                  >
                    {tNav('about')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold mb-8">
                {t('contact')}
              </h5>
              <ul className="space-y-4 text-sm text-beige-100/60">
                <li>(31) 3881-8049</li>
                <li>R. Pe. José Alvarenga, 50</li>
                <li>Paraíso — Ponte Nova, MG</li>
                <li>
                  <a
                    href="mailto:hotelrparaiso@gmail.com"
                    className="transition-colors hover:text-brand-gold"
                  >
                    hotelrparaiso@gmail.com
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold mb-8">
                {t('info')}
              </h5>
              <ul className="space-y-4 text-sm text-beige-100/60">
                <li>{t('checkin')}</li>
                <li>{t('checkout')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-10 px-4 md:px-16 mx-auto max-w-[1440px] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-beige-100/40">
          &copy; {new Date().getFullYear()} Hotel e Restaurante Paraíso. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
