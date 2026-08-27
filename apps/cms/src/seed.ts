import { getPayload } from 'payload';
import config from './payload.config.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_PUBLIC = path.resolve(__dirname, '../../web/public');

async function upload(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string
) {
  const abs = path.resolve(WEB_PUBLIC, filePath.replace(/^\//, ''));
  if (!fs.existsSync(abs)) {
    console.warn(`  [SKIP] ${abs}`);
    return null;
  }
  const buffer = fs.readFileSync(abs);
  const m = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data: buffer, name: path.basename(abs), mimetype: 'image/jpeg', size: buffer.length },
  });
  console.log(`  [OK] ${path.basename(abs)} -> ${m.id}`);
  return m;
}

async function seed() {
  console.log('\n=== SEED CMS ===\n');
  const payload = await getPayload({ config });

  const rooms = [
    {
      name: 'Confort',
      slug: 'confort',
      startingPrice: 'A partir de R$ 130',
      shortDescription: 'Acomodacao acessivel com ventilador. Individual, duplo ou casal.',
      longDescription:
        'A categoria Confort oferece o essencial para uma estadia tranquila em Ponte Nova. Disponivel em tres opcoes: Suite Confort individual (1 cama solteiro), Suite Duplo Confort (2 camas solteiro) e Suite Confort casal (cama casal). Todas com ventilador de teto, Wi-Fi e cafe da manha incluso.',
      capacityLabel: '1-2 adultos',
      capacity: { adults: 2, children: 0 },
      size: 15,
      order: 0,
      amenities: [
        'Wi-Fi de alta velocidade',
        'Ventilador de teto',
        'TV LED 32"',
        'Frigobar',
        'Chuveiro quente',
        'Toalhas e roupas de cama',
        'Tomadas USB ao lado da cama',
      ],
      featured: '/images/rooms/confort-1.jpg',
      imgs: [
        '/images/rooms/confort-1.jpg',
        '/images/rooms/confort-2.jpg',
        '/images/rooms/confort-3.jpg',
      ],
    },
    {
      name: 'Standard',
      slug: 'standard',
      startingPrice: 'A partir de R$ 180',
      shortDescription: 'Conforto com ar condicionado. Individual, casal ou triplo.',
      longDescription:
        'Quarto funcional e bem equipado com ar-condicionado para quem precisa de uma base confortavel em Ponte Nova. Disponivel como Suite Standard (individual ou casal) e Suite Triplo Standard (casal + 1 box solteiro ou 3 box solteiro). Wi-Fi rapido, mesa de trabalho e cafe da manha incluso.',
      capacityLabel: '1-3 adultos',
      capacity: { adults: 3, children: 0 },
      size: 18,
      order: 1,
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
      featured: '/images/rooms/standard.jpg',
      imgs: [
        '/images/rooms/standard.jpg',
        '/images/rooms/standard-2.jpg',
        '/images/rooms/standard-bath.jpg',
        '/images/rooms/standard-triplo.jpg',
        '/images/rooms/standard-triplo-2.jpg',
        '/images/rooms/standard-pet.jpg',
      ],
    },
    {
      name: 'Luxo',
      slug: 'luxo',
      startingPrice: 'A partir de R$ 280',
      shortDescription: 'Espaco amplo com acabamentos premium e ventilador de teto.',
      longDescription:
        'Ambiente amplo com 25m2 de acabamentos premium. TV 50", minibar abastecido e chuveiro com ducha dupla. Ventilador de teto silencioso. Disponivel como Suite Luxo individual ou casal (cama casal ou 2 box solteiro). O quarto Luxo e a escolha certa para quem quer mais conforto.',
      capacityLabel: '2 adultos',
      capacity: { adults: 2, children: 0 },
      size: 25,
      order: 2,
      amenities: [
        'Wi-Fi de alta velocidade',
        'Ventilador de teto silencioso',
        'TV LED 50"',
        'Minibar abastecido',
        'Roupao e chinelos',
        'Chuveiro com ducha dupla',
        'Amenities premium',
        'Mesa de trabalho',
        'Tomadas USB ao lado da cama',
      ],
      featured: '/images/rooms/luxo.jpg',
      imgs: [
        '/images/rooms/luxo.jpg',
        '/images/rooms/luxo-2.jpg',
        '/images/rooms/luxo-bath.jpg',
        '/images/rooms/luxo-triplo.jpg',
        '/images/rooms/luxo-casal.jpg',
        '/images/rooms/luxo-casal-3.jpg',
        '/images/rooms/luxo-triplo-3.jpg',
      ],
    },
    {
      name: 'Suite Master',
      slug: 'master',
      startingPrice: 'A partir de R$ 420',
      shortDescription:
        'Nossa melhor acomodacao. Ar condicionado, sala de estar e servico exclusivo.',
      longDescription:
        'A Suite Master e para quem quer o maximo. Sao 35m2 com ar-condicionado, sala de estar separada, TV 55" e room service. Disponivel como Casal Master (individual ou casal) e Casal Triplo Master (casal + 1 box solteiro ou 3 box solteiro). Perfeita para ocasioes especiais.',
      capacityLabel: '1-3 adultos',
      capacity: { adults: 3, children: 0 },
      size: 35,
      order: 3,
      amenities: [
        'Wi-Fi de alta velocidade',
        'Ar-condicionado split silencioso',
        'TV LED 55"',
        'Minibar abastecido',
        'Sala de estar separada',
        'Roupao e chinelos',
        'Amenities premium',
        'Room service',
        'Vista privilegiada',
      ],
      featured: '/images/rooms/master.jpg',
      imgs: [
        '/images/rooms/master.jpg',
        '/images/rooms/master-2.jpg',
        '/images/rooms/master-3.jpg',
        '/images/rooms/master-bath.jpg',
        '/images/rooms/master-suite.jpg',
        '/images/rooms/master-casal.jpg',
      ],
    },
  ];

  for (const r of rooms) {
    console.log(`Quarto: ${r.name}`);
    const feat = await upload(payload, r.featured, r.name);
    const gal: { image: number }[] = [];
    for (const i of r.imgs) {
      const m = await upload(payload, i, `${r.name} - Galeria`);
      if (m) gal.push({ image: m.id as number });
    }
    await payload.create({
      collection: 'rooms',
      data: {
        name: r.name,
        slug: r.slug,
        status: 'published',
        startingPrice: r.startingPrice,
        shortDescription: r.shortDescription,
        longDescription: r.longDescription,
        capacityLabel: r.capacityLabel,
        capacity: r.capacity,
        size: r.size,
        displayOrder: r.order,
        amenities: r.amenities.map((a) => ({ name: a })),
        featuredImage: feat ? (feat.id as number) : undefined,
        gallery: gal,
      },
    });
    console.log(`  [OK] "${r.name}"\n`);
  }

  console.log('--- Galeria ---\n');
  const gallery = [
    { src: '/images/rooms/master.jpg', alt: 'Suite Master', cat: 'rooms' },
    { src: '/images/rooms/master-2.jpg', alt: 'Suite Master - Detalhe', cat: 'rooms' },
    { src: '/images/rooms/master-hidro.jpg', alt: 'Hidromassagem', cat: 'rooms' },
    { src: '/images/rooms/luxo.jpg', alt: 'Quarto Luxo', cat: 'rooms' },
    { src: '/images/rooms/luxo-casal.jpg', alt: 'Quarto Luxo - Casal', cat: 'rooms' },
    { src: '/images/rooms/standard.jpg', alt: 'Quarto Standard', cat: 'rooms' },
    { src: '/images/rooms/standard-triplo.jpg', alt: 'Standard - Familia', cat: 'rooms' },
    { src: '/images/common/fachada.jpg', alt: 'Fachada', cat: 'common' },
    { src: '/images/common/recepcao.jpg', alt: 'Recepcao', cat: 'common' },
    { src: '/images/common/pista-eventos.jpg', alt: 'Pista de eventos', cat: 'common' },
    { src: '/images/common/salao-cafe.jpg', alt: 'Cafe da manha', cat: 'restaurant' },
    { src: '/images/common/restaurante.jpg', alt: 'Restaurante', cat: 'restaurant' },
    { src: '/images/restaurant/prato-1.jpg', alt: 'Gastronomia', cat: 'restaurant' },
    { src: '/images/restaurant/prato-2.jpg', alt: 'Gastronomia mineira', cat: 'restaurant' },
  ];
  for (let i = 0; i < gallery.length; i++) {
    const g = gallery[i];
    if (!g) continue;
    const m = await upload(payload, g.src, g.alt);
    if (m) {
      await payload.create({
        collection: 'gallery',
        data: { title: g.alt, category: g.cat, image: m.id as number, order: i },
      });
      console.log(`  [OK] Galeria: "${g.alt}"`);
    }
  }

  console.log('\n=== SEED COMPLETO ===\n');
  process.exit(0);
}
seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
