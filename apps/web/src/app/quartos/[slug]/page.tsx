import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const roomsData: Record<
  string,
  {
    name: string;
    description: string;
    longDescription: string;
    price: string;
    capacity: string;
    size: string;
    amenities: string[];
    images: string[];
  }
> = {
  standard: {
    name: 'Standard',
    description: 'Conforto essencial para uma estadia agradável.',
    longDescription:
      'O quarto Standard oferece o conforto essencial para viajantes corporativos e famílias que buscam praticidade. Com decoração moderna e funcional, o quarto conta com tudo que você precisa para uma estadia produtiva e relaxante em Ponte Nova.',
    price: 'R$ 180',
    capacity: '2 adultos',
    size: '18m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ar condicionado split',
      'TV LED 32"',
      'Frigobar',
      'Chuveiro quente',
      'Toalhas e roupas de cama premium',
      'Mesa de trabalho',
      'Tomadas USB',
    ],
    images: [
      '/images/rooms/standard.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-bath.jpg',
    ],
  },
  luxo: {
    name: 'Luxo',
    description: 'Espaço amplo com acabamentos premium.',
    longDescription:
      'O quarto Luxo oferece espaço amplo com acabamentos premium e vista privilegiada. Ideal para casais e famílias que desejam uma experiência superior, com amenidades extras que fazem toda a diferença na sua estadia.',
    price: 'R$ 280',
    capacity: '2 adultos + 1 criança',
    size: '25m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ar condicionado split',
      'TV LED 50"',
      'Frigobar abastecido',
      'Cofre digital',
      'Roupão e chinelos',
      'Chuveiro com ducha dupla',
      'Amenities premium',
      'Mesa de trabalho',
      'Tomadas USB',
    ],
    images: ['/images/rooms/luxo.jpg', '/images/rooms/luxo-2.jpg', '/images/rooms/luxo-bath.jpg'],
  },
  master: {
    name: 'Suíte Master',
    description: 'Nossa melhor acomodação com hidromassagem.',
    longDescription:
      'A Suíte Master é a nossa melhor acomodação. Com hidromassagem privativa, sala de estar separada e serviço exclusivo, é perfeita para ocasiões especiais ou para quem busca o máximo de conforto e sofisticação em Ponte Nova.',
    price: 'R$ 420',
    capacity: '2 adultos + 2 crianças',
    size: '35m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ar condicionado split',
      'TV LED 55"',
      'Frigobar abastecido',
      'Hidromassagem privativa',
      'Sala de estar separada',
      'Cofre digital',
      'Roupão e chinelos',
      'Amenities premium',
      'Serviço de quarto',
      'Vista privilegiada',
    ],
    images: [
      '/images/rooms/master.jpg',
      '/images/rooms/master-2.jpg',
      '/images/rooms/master-3.jpg',
      '/images/rooms/master-bath.jpg',
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(roomsData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = roomsData[slug];
  if (!room) return {};
  return {
    title: `${room.name} — Hotel Paraíso`,
    description: room.description,
  };
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const room = roomsData[slug];
  if (!room) notFound();

  return (
    <main className="pt-16">
      {/* Photo grid — padrão Airbnb */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2">
          {/* Main photo */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-l-lg md:col-span-2 md:row-span-2">
            <Image
              src={room.images[0] ?? ''}
              alt={room.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Secondary photos */}
          {room.images.slice(1, 5).map((img, i) => (
            <div
              key={img}
              className={`relative hidden aspect-[4/3] overflow-hidden md:block ${
                i === 1 ? 'rounded-tr-lg' : i === 2 ? 'rounded-br-lg' : ''
              }`}
            >
              <Image src={img} alt={`${room.name} ${i + 2}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Info */}
          <div className="lg:col-span-2">
            <h1 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
              {room.name}
            </h1>
            <div className="mt-2 flex gap-4 text-sm text-beige-700">
              <span>{room.capacity}</span>
              <span>·</span>
              <span>{room.size}</span>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-beige-800">{room.longDescription}</p>

            {/* Amenities */}
            <div className="mt-10">
              <h2 className="font-display text-xl font-bold text-brand-black">
                O que este quarto oferece
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-3 text-beige-800">
                    <span className="text-brand-gold">✓</span>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking card — sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-sm border border-beige-200 bg-brand-white p-6 shadow-lg">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-brand-black">
                  {room.price}
                </span>
                <span className="text-sm text-beige-600">/ noite</span>
              </div>

              <div className="mt-6 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-sm border border-beige-300 bg-beige-50 px-3 py-2.5 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-beige-700">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-sm border border-beige-300 bg-beige-50 px-3 py-2.5 text-sm outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  />
                </div>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-sm bg-brand-gold py-3 text-sm font-semibold uppercase tracking-widest text-brand-black transition-colors hover:bg-gold-400"
              >
                Reservar agora
              </button>

              <p className="mt-3 text-center text-xs text-beige-600">
                Cancelamento gratuito até 48h antes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <section className="border-t border-beige-200 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <Link
            href="/#quartos"
            className="text-sm text-brand-gold transition-colors hover:text-gold-700"
          >
            ← Voltar para todos os quartos
          </Link>
        </div>
      </section>
    </main>
  );
}
