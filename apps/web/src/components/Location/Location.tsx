'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Car, Phone, Mail } from 'lucide-react';

export function Location() {
  const t = useTranslations('location');

  return (
    <section id="contato" className="bg-brand-black">
      <div className="grid lg:grid-cols-2">
        {/* Map — full bleed left */}
        <div className="min-h-[350px] lg:min-h-[500px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3738.5!2d-42.9078!3d-20.4167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zUi4gUGFkcmUgSm9zw6kgQWx2YXJlbmdhLCA1MCAtIFBhcmHDrXNvLCBQb250ZSBOb3ZhIC0gTUcsIDM1NDMwLTMwMw!5e0!3m2!1spt-BR!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t('title')}
          />
        </div>

        {/* Info — right half */}
        <div className="flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-16">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
          <p className="mt-2 text-white/50">{t('city')}</p>

          <div className="mt-8 space-y-5">
            <div className="flex items-start gap-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-white">{t('address')}</p>
                <p className="text-sm text-white/50">{t('neighborhood')}</p>
                <p className="text-sm text-white/50">{t('cep')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Car className="h-5 w-5 shrink-0 text-brand-gold" strokeWidth={1.5} />
              <span className="text-sm text-white/80">{t('distance')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 shrink-0 text-brand-gold" strokeWidth={1.5} />
              <span className="text-sm text-white/80">{t('reception')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 shrink-0 text-brand-gold" strokeWidth={1.5} />
              <a
                href="mailto:hotelrparaiso@gmail.com"
                className="text-sm text-white/80 transition-colors hover:text-brand-gold"
              >
                hotelrparaiso@gmail.com
              </a>
            </div>
          </div>

          <a
            href="https://www.google.com/maps/dir//R.+Padre+Jos%C3%A9+Alvarenga,+50+-+Para%C3%ADso,+Ponte+Nova+-+MG,+35430-303"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-sm bg-brand-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            {t('route')}
          </a>
        </div>
      </div>
    </section>
  );
}
