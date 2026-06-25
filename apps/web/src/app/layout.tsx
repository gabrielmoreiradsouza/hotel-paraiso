import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header/Header';
import { Analytics } from '@/components/Analytics/Analytics';
import { WhatsAppButton } from '@/components/WhatsAppButton/WhatsAppButton';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Hotel e Restaurante Paraíso — Ponte Nova, MG',
    template: '%s | Hotel Paraíso',
  },
  description:
    'Hotel e Restaurante Paraíso em Ponte Nova, MG. Conforto e sofisticação para viajantes corporativos e famílias. Reserve agora.',
  keywords: ['hotel ponte nova', 'hotel minas gerais', 'hotel corporativo', 'restaurante paraíso'],
  openGraph: {
    title: 'Hotel e Restaurante Paraíso — Ponte Nova, MG',
    description:
      'Conforto e sofisticação em Ponte Nova, MG. Quartos Standard, Luxo e Suíte Master. Reserve agora.',
    url: 'https://hotelparaiso.moreirads.cloud',
    siteName: 'Hotel Paraíso',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://hotelparaiso.moreirads.cloud' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: 'Hotel e Restaurante Paraíso',
  description:
    'Hotel e Restaurante em Ponte Nova, MG. Conforto e sofisticação para viajantes corporativos e famílias.',
  url: 'https://hotelparaiso.moreirads.cloud',
  telephone: '',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Ponte Nova',
    addressRegion: 'MG',
    addressCountry: 'BR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -20.41,
    longitude: -42.9,
  },
  starRating: {
    '@type': 'Rating',
    ratingValue: '4',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Wi-Fi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Estacionamento', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurante', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Pet friendly', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Carregador veicular', value: true },
  ],
  checkinTime: '14:00',
  checkoutTime: '12:00',
  priceRange: 'R$ 180 - R$ 420',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script dangerouslySetInnerHTML={{ __html: 'window.dataLayer=window.dataLayer||[];' }} />
      </head>
      <body>
        <Analytics />
        <Header />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
