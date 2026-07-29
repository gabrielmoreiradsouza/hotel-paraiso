import { Hero } from '@/components/Hero/Hero';
import { BookingWidget } from '@/components/BookingWidget/BookingWidget';
import { RoomCards } from '@/components/RoomCards/RoomCards';
import { Features } from '@/components/Features/Features';
import { Location } from '@/components/Location/Location';
import { Footer } from '@/components/Footer/Footer';
import { HomeCta } from '@/components/HomeCta/HomeCta';
import { FAQ } from '@/components/FAQ/FAQ';

export default function Home() {
  return (
    <>
      <Hero />
      <BookingWidget />
      <RoomCards />
      <Features />
      <FAQ />
      <Location />
      <HomeCta />
      <Footer />
    </>
  );
}
