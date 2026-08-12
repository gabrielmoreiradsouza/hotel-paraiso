const CMS_URL = process.env['CMS_URL'] ?? 'http://localhost:3003';

interface PayloadResponse<T> {
  docs: T[];
  totalDocs: number;
}

export interface CmsMedia {
  id: number;
  alt: string;
  url: string;
  sizes?: { thumbnail?: { url: string }; card?: { url: string }; hero?: { url: string } };
}

export interface CmsRoom {
  id: number;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  startingPrice?: string;
  shortDescription?: string;
  longDescription?: string;
  featuredImage?: CmsMedia | number;
  gallery?: { image: CmsMedia | number }[];
  amenities?: { name: string; icon?: string }[];
  capacityLabel?: string;
  capacity?: { adults: number; children: number };
  size?: number;
  displayOrder?: number;
  seo?: { title?: string; description?: string };
}

export interface CmsGalleryItem {
  id: number;
  title: string;
  category: 'rooms' | 'common' | 'restaurant';
  image: CmsMedia | number;
  order: number;
}

export function getMediaUrl(media: CmsMedia | number | undefined): string {
  if (!media || typeof media === 'number') return '';
  if (media.url.startsWith('/')) return `${CMS_URL}${media.url}`;
  return media.url;
}

async function cmsGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${CMS_URL}/api${path}`, { next: { revalidate, tags: ['cms'] } });
  if (!res.ok) throw new Error(`CMS: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getRooms(): Promise<CmsRoom[]> {
  return (
    await cmsGet<PayloadResponse<CmsRoom>>(
      '/rooms?where[status][equals]=published&sort=displayOrder&depth=1&limit=20'
    )
  ).docs;
}

export async function getRoom(slug: string): Promise<CmsRoom | null> {
  const d = await cmsGet<PayloadResponse<CmsRoom>>(
    `/rooms?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=1&limit=1`
  );
  return d.docs[0] ?? null;
}

export async function getRoomSlugs(): Promise<string[]> {
  return (
    await cmsGet<PayloadResponse<{ slug: string }>>(
      '/rooms?where[status][equals]=published&limit=20&depth=0'
    )
  ).docs.map((d) => d.slug);
}

export async function getGalleryItems(): Promise<CmsGalleryItem[]> {
  return (await cmsGet<PayloadResponse<CmsGalleryItem>>('/gallery?sort=order&depth=1&limit=100'))
    .docs;
}
