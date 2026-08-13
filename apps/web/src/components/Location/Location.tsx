'use client';

import { useTranslations } from 'next-intl';

export function Location() {
  const t = useTranslations('location');

  return (
    <section id="contato" className="bg-brand-black py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{t('title')}</h2>
          <p className="mt-4 text-white/50">{t('city')}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Map */}
          <div className="aspect-video overflow-hidden rounded-sm bg-white/5">
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

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h3 className="font-display text-2xl font-bold text-white">{t('howToGet')}</h3>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 text-brand-gold">{'\u{1F4CD}'}</span>
                <div>
                  <p className="font-medium text-white">{t('address')}</p>
                  <p className="text-sm text-white/50">{t('neighborhood')}</p>
                  <p className="text-sm text-white/50">{t('cep')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">{'\u{1F697}'}</span>
                <span className="text-sm text-white/80">{t('distance')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">{'\u{1F4DE}'}</span>
                <span className="text-sm text-white/80">{t('reception')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-brand-gold">{'\u2709\uFE0F'}</span>
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
      </div>
    </section>
  );
}
