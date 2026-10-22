export const revalidate = 60;

import type { Metadata } from 'next';
import { Hero } from '@/components/Hero/Hero';
import { QuickBook } from '@/components/QuickBook/QuickBook';
import { Reviews } from '@/components/Reviews/Reviews';
import { Features } from '@/components/Features/Features';
import { Location } from '@/components/Location/Location';
import { Footer } from '@/components/Footer/Footer';
import { HomeCta } from '@/components/HomeCta/HomeCta';
import { FAQ } from '@/components/FAQ/FAQ';
import { Restaurant } from '@/components/Restaurant/Restaurant';

/**
 * Variante B da home (ADR-0013). Servida em `/` pelo middleware para metade dos
 * visitantes; o caminho `/variante-b` em si não é indexável e aponta para a home.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  robots: { index: false, follow: true },
};

export default function HomeVariantB() {
  return (
    <>
      <Hero compact />
      <QuickBook />
      <Reviews />
      <Restaurant />
      <Features />
      <HomeCta />
      <FAQ />
      <Location />
      <Footer />
    </>
  );
}
