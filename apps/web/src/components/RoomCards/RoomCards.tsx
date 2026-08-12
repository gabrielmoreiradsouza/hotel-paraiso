import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getRooms, getMediaUrl } from '@/lib/cms';

const fallbackRooms = [
  {
    slug: 'confort',
    name: 'Confort',
    description: 'Acomodação acessível com ventilador. Individual, duplo ou casal.',
    price: 'A partir de R$ 130',
    image: '/images/rooms/standard.jpg',
    capacity: '1–2 adultos',
    amenities: ['Wi-Fi', 'Ventilador', 'TV', 'Frigobar'],
  },
  {
    slug: 'standard',
    name: 'Standard',
    description: 'Conforto com ar condicionado. Individual, casal ou triplo.',
    price: 'A partir de R$ 180',
    image: '/images/rooms/standard.jpg',
    capacity: '1–3 adultos',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV', 'Frigobar'],
  },
  {
    slug: 'luxo',
    name: 'Luxo',
    description: 'Espaço amplo com acabamentos premium e ventilador de teto.',
    price: 'A partir de R$ 280',
    image: '/images/rooms/luxo.jpg',
    capacity: '2 adultos',
    amenities: ['Wi-Fi', 'Ventilador', 'TV 50"', 'Frigobar'],
  },
  {
    slug: 'master',
    name: 'Suíte Master',
    description: 'Nossa melhor acomodação. Ar condicionado, sala de estar e serviço exclusivo.',
    price: 'A partir de R$ 420',
    image: '/images/rooms/master.jpg',
    capacity: '1–3 adultos',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV 55"', 'Sala de estar'],
  },
];

export async function RoomCards() {
  const t = await getTranslations('rooms');

  let rooms = fallbackRooms;
  try {
    const cmsRooms = await getRooms();
    if (cmsRooms.length > 0) {
      rooms = cmsRooms.map((r) => ({
        slug: r.slug,
        name: r.name,
        description: r.shortDescription ?? '',
        price: r.startingPrice ?? '',
        image:
          getMediaUrl(typeof r.featuredImage === 'number' ? undefined : r.featuredImage) ||
          '/images/rooms/standard.jpg',
        capacity: r.capacityLabel ?? '',
        amenities: (r.amenities?.map((a) => a.name) ?? []).slice(0, 4),
      }));
    }
  } catch {
    // CMS unavailable — use fallbackRooms
  }

  return (
    <section id="quartos" className="bg-brand-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-beige-700">{t('subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room) => (
            <article
              key={room.slug}
              className="group overflow-hidden rounded-sm border border-beige-200 bg-brand-white shadow-sm transition-shadow hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-beige-100">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized={room.image.startsWith('http')}
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-brand-black">{room.name}</h3>
                <p className="mt-2 text-sm text-beige-700">{room.description}</p>

                {/* Amenities */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-sm bg-beige-100 px-2 py-1 text-xs text-beige-800"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                {/* Capacity + Price */}
                <div className="mt-6 flex items-end justify-between border-t border-beige-200 pt-4">
                  <span className="text-xs text-beige-600">{room.capacity}</span>
                  <span className="font-display text-lg font-bold text-gold-700">{room.price}</span>
                </div>

                {/* CTA */}
                <a
                  href={`/quartos/${room.slug}`}
                  className="mt-4 block w-full rounded-sm border border-brand-gold py-2.5 text-center text-sm font-semibold uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-black"
                >
                  {t('details')}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
