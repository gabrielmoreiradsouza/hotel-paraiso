import { Hero } from '@/components/Hero/Hero';
import { BookingWidget } from '@/components/BookingWidget/BookingWidget';
import { RoomCards } from '@/components/RoomCards/RoomCards';
import { Features } from '@/components/Features/Features';
import { Location } from '@/components/Location/Location';
import { Footer } from '@/components/Footer/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <BookingWidget />
      <RoomCards />
      <Features />
      <Location />

      {/* CTA final */}
      <section className="bg-brand-black py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-bold text-brand-white sm:text-4xl">
            Reserve sua estadia no <span className="text-brand-gold">Paraíso</span>
          </h2>
          <p className="mt-4 text-beige-400">
            Conforto, gastronomia e localização estratégica em Ponte Nova, MG.
          </p>
          <a
            href="#quartos"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-brand-gold px-10 py-4 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
          >
            Escolher quarto
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
