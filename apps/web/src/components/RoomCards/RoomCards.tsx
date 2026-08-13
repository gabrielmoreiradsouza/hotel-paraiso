import { getTranslations } from 'next-intl/server';
import { getRooms, getMediaUrl } from '@/lib/cms';
import { RoomCarousel } from './RoomCarousel';

export type RoomCardData = {
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: string;
  image: string;
  images: string[];
  capacity: string;
  size: string;
  amenities: string[];
};

const fallbackRooms: RoomCardData[] = [
  {
    slug: 'confort',
    name: 'Confort',
    description: 'Acomodação acessível com ventilador. Individual, duplo ou casal.',
    longDescription:
      'A categoria Confort oferece o essencial para uma estadia tranquila em Ponte Nova. Disponível em três opções: Suite Confort individual (1 cama solteiro), Suite Duplo Confort (2 camas solteiro) e Suite Confort casal (cama casal). Todas com ventilador de teto, Wi-Fi e café da manhã incluso.',
    price: 'A partir de R$ 130',
    image: '/images/rooms/standard.jpg',
    images: [
      '/images/rooms/standard.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-bath.jpg',
    ],
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
  },
  {
    slug: 'standard',
    name: 'Standard',
    description: 'Conforto com ar condicionado. Individual, casal ou triplo.',
    longDescription:
      'Quarto funcional e bem equipado com ar-condicionado para quem precisa de uma base confortável em Ponte Nova. Disponível como Suite Standard (individual ou casal) e Suite Triplo Standard (casal + 1 box solteiro ou 3 box solteiro). Wi-Fi rápido, mesa de trabalho e café da manhã incluso.',
    price: 'A partir de R$ 180',
    image: '/images/rooms/standard.jpg',
    images: [
      '/images/rooms/standard.jpg',
      '/images/rooms/standard-2.jpg',
      '/images/rooms/standard-bath.jpg',
      '/images/rooms/standard-triplo.jpg',
      '/images/rooms/standard-triplo-2.jpg',
      '/images/rooms/standard-pet.jpg',
    ],
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
  },
  {
    slug: 'luxo',
    name: 'Luxo',
    description: 'Espaço amplo com acabamentos premium e ventilador de teto.',
    longDescription:
      'Ambiente amplo com 25m² de acabamentos premium. TV 50", frigobar e chuveiro com ducha dupla. Ventilador de teto silencioso. Disponível como Suite Luxo individual ou casal (cama casal ou 2 box solteiro). O quarto Luxo é a escolha certa para quem quer mais conforto — perfeito para casais ou estadias mais longas.',
    price: 'A partir de R$ 280',
    image: '/images/rooms/luxo.jpg',
    images: [
      '/images/rooms/luxo.jpg',
      '/images/rooms/luxo-2.jpg',
      '/images/rooms/luxo-bath.jpg',
      '/images/rooms/luxo-triplo.jpg',
      '/images/rooms/luxo-casal.jpg',
      '/images/rooms/luxo-casal-3.jpg',
      '/images/rooms/luxo-triplo-3.jpg',
    ],
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
  },
  {
    slug: 'master',
    name: 'Suíte Master',
    description: 'Nossa melhor acomodação. Ar condicionado, sala de estar e serviço exclusivo.',
    longDescription:
      'A Suíte Master é para quem quer o máximo. São 35m² com ar-condicionado, sala de estar separada, TV 55" e room service. Disponível como Casal Master (individual ou casal) e Casal Triplo Master (casal + 1 box solteiro ou 3 box solteiro). Perfeita para ocasiões especiais ou simplesmente para quem merece o melhor que Ponte Nova tem a oferecer.',
    price: 'A partir de R$ 420',
    image: '/images/rooms/master.jpg',
    images: [
      '/images/rooms/master.jpg',
      '/images/rooms/master-2.jpg',
      '/images/rooms/master-3.jpg',
      '/images/rooms/master-bath.jpg',
      '/images/rooms/master-suite.jpg',
      '/images/rooms/master-casal.jpg',
    ],
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
  },
];

export async function RoomCards() {
  const t = await getTranslations('rooms');

  let rooms: RoomCardData[] = fallbackRooms;
  try {
    const cmsRooms = await getRooms();
    if (cmsRooms.length > 0) {
      rooms = cmsRooms.map((r) => {
        const galleryImages =
          r.gallery
            ?.map((g) => getMediaUrl(typeof g.image === 'number' ? undefined : g.image))
            .filter(Boolean) ?? [];
        const featuredUrl = getMediaUrl(
          typeof r.featuredImage === 'number' ? undefined : r.featuredImage
        );
        if (featuredUrl && !galleryImages.includes(featuredUrl)) {
          galleryImages.unshift(featuredUrl);
        }
        const mainImage = featuredUrl || galleryImages[0] || '/images/rooms/standard.jpg';

        return {
          slug: r.slug,
          name: r.name,
          description: r.shortDescription ?? '',
          longDescription: r.longDescription ?? '',
          price: r.startingPrice ?? '',
          image: mainImage,
          images: galleryImages.length > 0 ? galleryImages : [mainImage],
          capacity: r.capacityLabel ?? '',
          size: r.size ? `${r.size}m²` : '',
          amenities: r.amenities?.map((a) => a.name) ?? [],
        };
      });
    }
  } catch {
    // CMS unavailable — use fallbackRooms
  }

  return (
    <RoomCarousel
      rooms={rooms}
      title={t('title')}
      subtitle={t('subtitle')}
      detailsLabel={t('details')}
    />
  );
}
