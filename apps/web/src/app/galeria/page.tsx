import { getGalleryItems, getMediaUrl } from '@/lib/cms';
import { GalleryClient } from './gallery-client';

const fallbackPhotos: { src: string; alt: string; category: 'rooms' | 'common' | 'restaurant' }[] =
  [
    // Rooms — Master (8)
    { src: '/images/rooms/master.jpg', alt: 'Suíte Master', category: 'rooms' },
    { src: '/images/rooms/master-2.jpg', alt: 'Suíte Master — Detalhe', category: 'rooms' },
    { src: '/images/rooms/master-3.jpg', alt: 'Suíte Master — Vista', category: 'rooms' },
    { src: '/images/rooms/master-bath.jpg', alt: 'Suíte Master — Banheiro', category: 'rooms' },
    { src: '/images/rooms/master-hidro.jpg', alt: 'Hidromassagem — Opcional', category: 'rooms' },
    {
      src: '/images/rooms/master-hidro-2.jpg',
      alt: 'Hidromassagem — Detalhe (opcional)',
      category: 'rooms',
    },
    {
      src: '/images/rooms/master-suite.jpg',
      alt: 'Suíte Master — Sala de estar',
      category: 'rooms',
    },
    { src: '/images/rooms/master-casal.jpg', alt: 'Suíte Master — Casal', category: 'rooms' },
    // Rooms — Luxo (7)
    { src: '/images/rooms/luxo.jpg', alt: 'Quarto Luxo', category: 'rooms' },
    { src: '/images/rooms/luxo-2.jpg', alt: 'Quarto Luxo — Detalhe', category: 'rooms' },
    { src: '/images/rooms/luxo-bath.jpg', alt: 'Quarto Luxo — Banheiro', category: 'rooms' },
    { src: '/images/rooms/luxo-triplo.jpg', alt: 'Quarto Luxo — Triplo', category: 'rooms' },
    { src: '/images/rooms/luxo-casal.jpg', alt: 'Quarto Luxo — Casal', category: 'rooms' },
    { src: '/images/rooms/luxo-casal-3.jpg', alt: 'Quarto Luxo — Casal vista', category: 'rooms' },
    {
      src: '/images/rooms/luxo-triplo-3.jpg',
      alt: 'Quarto Luxo — Triplo amplo',
      category: 'rooms',
    },
    // Rooms — Confort & Standard (6)
    { src: '/images/rooms/standard.jpg', alt: 'Quarto Confort / Standard', category: 'rooms' },
    { src: '/images/rooms/standard-2.jpg', alt: 'Quarto Standard — Detalhe', category: 'rooms' },
    {
      src: '/images/rooms/standard-bath.jpg',
      alt: 'Quarto Standard — Banheiro',
      category: 'rooms',
    },
    {
      src: '/images/rooms/standard-triplo.jpg',
      alt: 'Quarto Standard — Família',
      category: 'rooms',
    },
    {
      src: '/images/rooms/standard-triplo-2.jpg',
      alt: 'Quarto Standard — Família vista',
      category: 'rooms',
    },
    {
      src: '/images/rooms/standard-pet.jpg',
      alt: 'Quarto Standard — Pet Friendly',
      category: 'rooms',
    },
    // Common areas
    { src: '/images/common/fachada.jpg', alt: 'Fachada — Acesso ao hotel', category: 'common' },
    { src: '/images/common/fachada-2.jpg', alt: 'Fachada — Entrada', category: 'common' },
    { src: '/images/common/recepcao.jpg', alt: 'Recepção', category: 'common' },
    { src: '/images/common/recepcao-2.jpg', alt: 'Recepção — Lobby', category: 'common' },
    { src: '/images/common/salao-cafe.jpg', alt: 'Café da manhã — Salão', category: 'restaurant' },
    { src: '/images/common/pista-eventos.jpg', alt: 'Pista de eventos', category: 'common' },
    {
      src: '/images/common/carregador-veicular.jpg',
      alt: 'Carregador veicular elétrico',
      category: 'common',
    },
    // Restaurante & Eventos
    { src: '/images/common/restaurante.jpg', alt: 'Restaurante — Salão', category: 'restaurant' },
    { src: '/images/restaurant/salao-cafe-2.jpg', alt: 'Salão de café', category: 'restaurant' },
    {
      src: '/images/restaurant/salao-cafe-3.jpg',
      alt: 'Salão de café — Vista',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/prato-1.jpg',
      alt: 'Prato — Bife com batata',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/prato-2.jpg',
      alt: 'Prato — Gastronomia mineira',
      category: 'restaurant',
    },
    { src: '/images/common/hero.jpg', alt: 'Gastronomia', category: 'restaurant' },
    {
      src: '/images/restaurant/pista-foco-1.jpg',
      alt: 'Pista de eventos — Panorâmica',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-foco-2.jpg',
      alt: 'Pista de eventos — Detalhe',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-foco-3.jpg',
      alt: 'Pista de eventos — Estrutura',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-foco-4.jpg',
      alt: 'Pista de eventos — Vista lateral',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-2.jpg',
      alt: 'Pista de eventos — Ambiente',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-4.jpg',
      alt: 'Pista de eventos — Espaço',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-7.jpg',
      alt: 'Pista de eventos — Noturno',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-9.jpg',
      alt: 'Pista de eventos — Ampla',
      category: 'restaurant',
    },
    {
      src: '/images/restaurant/pista-10.jpg',
      alt: 'Pista de eventos — Cobertura',
      category: 'restaurant',
    },
  ];

export default async function GaleriaPage() {
  let photos = fallbackPhotos;

  try {
    const items = await getGalleryItems();
    if (items.length > 0) {
      photos = items
        .map((item) => ({
          src: getMediaUrl(typeof item.image === 'number' ? undefined : item.image) || '',
          alt: item.title,
          category: item.category,
        }))
        .filter((p) => p.src !== '');
    }
  } catch {
    // CMS unavailable — use fallbackPhotos
  }

  return <GalleryClient photos={photos} />;
}
