'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="bg-brand-black py-12 text-beige-300">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/brand/logo-192.png"
              alt="Hotel Paraíso"
              width={80}
              height={80}
              className="mb-4 invert"
            />
            <p className="text-sm text-beige-500">
              Hotel e Restaurante Paraíso.
              <br />
              Ponte Nova, MG.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              {t('hotel')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#quartos" className="transition-colors hover:text-brand-gold">
                  {tNav('rooms')}
                </a>
              </li>
              <li>
                <a href="/galeria" className="transition-colors hover:text-brand-gold">
                  {tNav('gallery')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              {t('contact')}
            </h4>
            <ul className="space-y-2 text-sm">
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

          {/* Policies */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
              {t('info')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>{t('checkin')}</li>
              <li>{t('checkout')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-beige-900 pt-8 text-center text-xs text-beige-600">
          &copy; {new Date().getFullYear()} Hotel e Restaurante Paraíso. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
