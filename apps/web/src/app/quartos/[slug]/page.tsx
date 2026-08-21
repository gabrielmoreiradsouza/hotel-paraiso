import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Droplets } from 'lucide-react';
import { RoomViewTracker } from './tracker';
import { RoomPhotoGallery } from './RoomPhotoGallery';
import { RoomBookingInline } from '@/components/RoomBooking/RoomBookingInline';
import { getRoom, getRoomSlugs, getMediaUrl, type CmsRoom } from '@/lib/cms';

const fallbackRooms: Record<
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
  confort: {
    name: 'Confort',
    description: 'Acomodação acessível com ventilador para uma estadia confortável.',
    longDescription:
      'A categoria Confort oferece o essencial para uma estadia tranquila em Ponte Nova. Disponível em três opções: Suite Confort individual (1 cama solteiro), Suite Duplo Confort (2 camas solteiro) e Suite Confort casal (cama casal). Todas com ventilador de teto, Wi-Fi e café da manhã incluso.',
    price: 'R$ 130',
    capacity: '1–2 adultos',
    size: '15m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ventilador de teto',
      'TV LED 32"',
      'Frigobar',
      'Chuveiro quente',
      'Toalhas e roupas de cama',
      'Tomadas USB ao lado da cama',
    ],
    images: [
      '/images/rooms/standard.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-bath.jpg',
    ],
  },
  standard: {
    name: 'Standard',
    description: 'Conforto com ar condicionado para viajantes corporativos.',
    longDescription:
      'Quarto funcional e bem equipado com ar-condicionado para quem precisa de uma base confortável em Ponte Nova. Disponível como Suite Standard (individual ou casal) e Suite Triplo Standard (casal + 1 box solteiro ou 3 box solteiro). Wi-Fi rápido, mesa de trabalho e café da manhã incluso.',
    price: 'R$ 180',
    capacity: '1–3 adultos',
    size: '18m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ar-condicionado split silencioso',
      'TV LED 32"',
      'Frigobar',
      'Chuveiro quente',
      'Toalhas e roupas de cama premium',
      'Mesa de trabalho',
      'Tomadas USB ao lado da cama',
    ],
    images: [
      '/images/rooms/standard.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-bath.jpg',
      '/images/rooms/standard-triplo.jpg',
      '/images/rooms/standard-triplo-2.jpg',
      '/images/rooms/standard-pet.jpg',
    ],
  },
  luxo: {
    name: 'Luxo',
    description: 'Mais espaço, mais conforto. Para estadias que pedem algo a mais.',
    longDescription:
      'Ambiente amplo com 25m² de acabamentos premium. TV 50", frigobar e chuveiro com ducha dupla. Ventilador de teto silencioso. Disponível como Suite Luxo individual ou casal (cama casal ou 2 box solteiro). O quarto Luxo é a escolha certa para quem quer mais conforto — perfeito para casais ou estadias mais longas.',
    price: 'R$ 280',
    capacity: '2 adultos',
    size: '25m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ventilador de teto silencioso',
      'TV LED 50"',
      'Frigobar',
      'Roupão e chinelos',
      'Chuveiro com ducha dupla',
      'Amenities premium',
      'Mesa de trabalho',
      'Tomadas USB ao lado da cama',
    ],
    images: [
      '/images/rooms/luxo.jpg',
      '/images/rooms/luxo-2.jpg',
      '/images/rooms/luxo-bath.jpg',
      '/images/rooms/luxo-triplo.jpg',
      '/images/rooms/luxo-casal.jpg',
      '/images/rooms/luxo-casal-3.jpg',
      '/images/rooms/luxo-triplo-3.jpg',
    ],
  },
  master: {
    name: 'Suíte Master',
    description: 'Nossa melhor acomodação. Para quem não abre mão do melhor.',
    longDescription:
      'A Suíte Master é para quem quer o máximo. São 35m² com ar-condicionado, sala de estar separada, TV 55" e room service. Disponível como Casal Master (individual ou casal) e Casal Triplo Master (casal + 1 box solteiro ou 3 box solteiro). Perfeita para ocasiões especiais ou simplesmente para quem merece o melhor que Ponte Nova tem a oferecer.',
    price: 'R$ 420',
    capacity: '1–3 adultos',
    size: '35m²',
    amenities: [
      'Wi-Fi de alta velocidade',
      'Ar-condicionado split silencioso',
      'TV LED 55"',
      'Frigobar',
      'Sala de estar separada',
      'Roupão e chinelos',
      'Amenities premium',
      'Room service',
      'Vista privilegiada',
    ],
    images: [
      '/images/rooms/master.jpg',
      '/images/rooms/master-2.jpg',
      '/images/rooms/master-3.jpg',
      '/images/rooms/master-bath.jpg',
      '/images/rooms/master-suite.jpg',
      '/images/rooms/master-casal.jpg',
    ],
  },
};

function cmsToRoom(cms: CmsRoom) {
  const images =
    cms.gallery
      ?.map((g) => getMediaUrl(typeof g.image === 'number' ? undefined : g.image))
      .filter(Boolean) ?? [];
  const featuredUrl = getMediaUrl(
    typeof cms.featuredImage === 'number' ? undefined : cms.featuredImage
  );
  if (featuredUrl && !images.includes(featuredUrl)) images.unshift(featuredUrl);
  return {
    name: cms.name,
    description: cms.shortDescription ?? '',
    longDescription: cms.longDescription ?? '',
    price: cms.startingPrice?.replace('A partir de ', '') ?? '',
    capacity: cms.capacityLabel ?? '',
    size: cms.size ? `${cms.size}m²` : '',
    amenities: cms.amenities?.map((a) => a.name) ?? [],
    images: images.length > 0 ? images : ['/images/rooms/standard.jpg'],
  };
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const slugs = await getRoomSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return Object.keys(fallbackRooms).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const cmsRoom = await getRoom(slug);
    if (cmsRoom) {
      return {
        title: `${cmsRoom.seo?.title ?? cmsRoom.name} — Hotel Paraíso`,
        description: cmsRoom.seo?.description ?? cmsRoom.shortDescription ?? '',
      };
    }
  } catch {
    // CMS unavailable — fall through to fallback
  }

  const room = fallbackRooms[slug];
  if (!room) return {};
  return {
    title: `${room.name} — Hotel Paraíso`,
    description: room.description,
  };
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;

  let room:
    | {
        name: string;
        description: string;
        longDescription: string;
        price: string;
        capacity: string;
        size: string;
        amenities: string[];
        images: string[];
      }
    | undefined;

  try {
    const cmsRoom = await getRoom(slug);
    if (cmsRoom) {
      room = cmsToRoom(cmsRoom);
    }
  } catch {
    // CMS unavailable — fall through to fallback
  }

  if (!room) {
    room = fallbackRooms[slug];
  }

  if (!room) notFound();

  const priceNum = parseInt(room.price.replace(/\D/g, ''), 10) || 0;

  return (
    <main className="bg-brand-black pt-16">
      <RoomViewTracker slug={slug} name={room.name} price={priceNum} />

      <section className="mx-auto max-w-[900px] px-4 py-8">
        {/* Photo gallery — single photo + thumbnail strip */}
        <RoomPhotoGallery images={room.images} name={room.name} />

        {/* White body card */}
        <div className="rounded-b-2xl bg-white p-6 text-brand-black sm:p-8">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-black sm:text-3xl">
                {room.name}
              </h1>
              <p className="mt-1 text-sm text-beige-700">
                {room.capacity} · {room.size}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-display text-2xl font-bold text-gold-700">{room.price}</span>
              <span className="block text-xs text-beige-600">/ noite</span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-5 leading-relaxed text-[#444]">{room.longDescription}</p>

          {/* Amenities grid */}
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-brand-black">
              O que este quarto oferece
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {room.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2.5 text-sm text-beige-800">
                  <span className="text-brand-gold">✓</span>
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          {/* Hydromassage upsell — only for Master */}
          {slug === 'master' && (
            <div className="mt-8 rounded-lg border border-gold-200 bg-gold-50 p-5">
              <div className="flex items-start gap-3">
                <Droplets className="h-6 w-6 text-brand-gold" strokeWidth={1.5} />
                <div>
                  <h3 className="font-display text-lg font-bold text-brand-black">
                    Hidromassagem — Upgrade disponível
                  </h3>
                  <p className="mt-1 text-sm text-[#444]">
                    Adicione banheira de hidromassagem à sua estadia por{' '}
                    <span className="font-semibold text-gold-700">R$ 120–150/noite</span>. Sujeito a
                    disponibilidade (2 unidades). Solicite na reserva ou no check-in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inline booking */}
          <RoomBookingInline roomSlug={slug} roomName={room.name} pricePerNight={priceNum} />
        </div>
      </section>

      {/* Back link */}
      <section className="border-t border-white/[0.08] py-8">
        <div className="mx-auto max-w-[900px] px-4">
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
