import type { Metadata } from 'next';
import { Raleway, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import './globals.css';

export const dynamic = 'force-dynamic';
import { Header } from '@/components/Header/Header';
import { Analytics } from '@/components/Analytics/Analytics';
import { WhatsAppButton } from '@/components/WhatsAppButton/WhatsAppButton';

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Hotel e Restaurante Paraíso — Ponte Nova, MG | Reserve Online',
    template: '%s | Hotel Paraíso — Ponte Nova, MG',
  },
  description:
    'Hotel e Restaurante Paraíso em Ponte Nova, MG. Quartos a partir de R$ 130/noite com café da manhã, Wi-Fi, estacionamento grátis e pet friendly. Reserve online.',
  keywords: [
    'hotel ponte nova',
    'hotel ponte nova mg',
    'hotel em ponte nova minas gerais',
    'hotel minas gerais',
    'hotel corporativo ponte nova',
    'hotel barato ponte nova',
    'pousada ponte nova mg',
    'hospedagem ponte nova',
    'restaurante ponte nova mg',
    'restaurante paraíso ponte nova',
    'hotel pet friendly ponte nova',
    'hotel com estacionamento ponte nova',
    'hotel zona da mata mineira',
    'hotel perto de belo horizonte',
    'reserva hotel ponte nova',
    'hotel com café da manhã ponte nova',
    'suíte master ponte nova',
    'hotel para eventos ponte nova',
  ],
  openGraph: {
    title: 'Hotel e Restaurante Paraíso — Ponte Nova, MG',
    description:
      'Quartos Confort, Standard, Luxo e Suíte Master a partir de R$ 130/noite. Café da manhã, Wi-Fi, estacionamento grátis e pet friendly. Reserve agora.',
    url: 'https://hotelparaiso.moreirads.cloud',
    siteName: 'Hotel Paraíso',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://hotelparaiso.moreirads.cloud' },
  verification: {
    google: process.env['NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION'] ?? undefined,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: 'Hotel e Restaurante Paraíso',
  description:
    'Hotel e Restaurante em Ponte Nova, MG. Quartos a partir de R$ 130/noite com café da manhã, Wi-Fi, estacionamento grátis e pet friendly.',
  url: 'https://hotelparaiso.moreirads.cloud',
  telephone: '+55-31-3881-8049',
  email: 'hotelrparaiso@gmail.com',
  image: 'https://hotelparaiso.moreirads.cloud/images/common/fachada.jpg',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Padre José Alvarenga, 50',
    addressLocality: 'Ponte Nova',
    addressRegion: 'MG',
    postalCode: '35430-303',
    addressCountry: 'BR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -20.4167,
    longitude: -42.9078,
  },
  starRating: {
    '@type': 'Rating',
    ratingValue: '4',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamento gratuito', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurante', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Pet friendly', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Carregador veicular elétrico', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Café da manhã incluso', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Recepção 24h', value: true },
  ],
  checkinTime: '14:00',
  checkoutTime: '12:00',
  priceRange: 'R$ 130 - R$ 420',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Cartão de crédito, Cartão de débito, Pix, Dinheiro',
  numberOfRooms: 46,
  petsAllowed: true,
  hasMap: 'https://maps.google.com/?q=-20.4167,-42.9078',
  potentialAction: {
    '@type': 'ReserveAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://hotelparaiso.moreirads.cloud/reservar',
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    result: {
      '@type': 'LodgingReservation',
      name: 'Reserva Hotel Paraíso',
    },
  },
  containsPlace: {
    '@type': 'Restaurant',
    name: 'Restaurante Paraíso',
    servesCuisine: 'Mineira',
    telephone: '+55-31-3881-8049',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${raleway.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: 'window.dataLayer=window.dataLayer||[];' }} />
        <link rel="icon" href="/brand/favicon.png" type="image/png" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Analytics />
          <Header locale={locale} />
          {children}
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
