import { Hero } from '@/components/Hero/Hero';
import { RoomCards } from '@/components/RoomCards/RoomCards';
import { Features } from '@/components/Features/Features';
import { Location } from '@/components/Location/Location';
import { Footer } from '@/components/Footer/Footer';
import { HomeCta } from '@/components/HomeCta/HomeCta';
import { FAQ } from '@/components/FAQ/FAQ';
import { Restaurant } from '@/components/Restaurant/Restaurant';

export default async function Home() {
  return (
    <>
      <Hero />
      <RoomCards />
      <Restaurant />
      <Features />
      <FAQ />
      <Location />
      <HomeCta />
      <Footer />
    </>
  );
}
