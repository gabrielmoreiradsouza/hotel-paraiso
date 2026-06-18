import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header/Header';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
