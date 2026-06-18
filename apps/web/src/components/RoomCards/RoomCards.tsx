import Image from 'next/image';

const rooms = [
  {
    slug: 'standard',
    name: 'Standard',
    description:
      'Conforto essencial para uma estadia agradável. Ideal para viajantes corporativos.',
    price: 'A partir de R$ 180',
    image: '/brand/logo.png', // placeholder — será substituído por foto real do CMS
    capacity: '2 adultos',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV', 'Frigobar'],
  },
  {
    slug: 'luxo',
    name: 'Luxo',
    description: 'Espaço amplo com acabamentos premium e vista privilegiada.',
    price: 'A partir de R$ 280',
    image: '/brand/logo.png',
    capacity: '2 adultos + 1 criança',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV 50"', 'Frigobar', 'Cofre'],
  },
  {
    slug: 'master',
    name: 'Suíte Master',
    description: 'Nossa melhor acomodação. Hidromassagem, sala de estar e serviço exclusivo.',
    price: 'A partir de R$ 420',
    image: '/brand/logo.png',
    capacity: '2 adultos + 2 crianças',
    amenities: ['Wi-Fi', 'Ar condicionado', 'TV 55"', 'Hidromassagem', 'Sala de estar'],
  },
];

export function RoomCards() {
  return (
    <section id="quartos" className="bg-brand-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-brand-black sm:text-4xl">
            Nossas Acomodações
          </h2>
          <p className="mt-4 text-beige-700">Escolha o conforto ideal para sua estadia</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
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
                  className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
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
                  <span className="font-display text-lg font-bold text-brand-gold">
                    {room.price}
                  </span>
                </div>

                {/* CTA */}
                <a
                  href={`/quartos/${room.slug}`}
                  className="mt-4 block w-full rounded-sm border border-brand-gold py-2.5 text-center text-sm font-semibold uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-black"
                >
                  Ver detalhes
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
