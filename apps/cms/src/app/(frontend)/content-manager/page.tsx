import { headers as getHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { ContentManagerClient } from './ContentManagerClient';

export const dynamic = 'force-dynamic';

export default async function ContentManagerPage() {
  const payload = await getPayload({ config: configPromise });
  const headersList = await getHeaders();

  // Check auth — redirect to login if not authenticated
  const { user } = await payload.auth({ headers: headersList });
  if (!user) {
    redirect('/admin/login');
  }

  // Pre-fetch rooms and gallery server-side for fast initial render
  const [roomsResult, galleryResult] = await Promise.all([
    payload.find({
      collection: 'rooms',
      depth: 2,
      locale: 'pt',
      sort: 'displayOrder',
      limit: 50,
    }),
    payload.find({
      collection: 'gallery',
      depth: 2,
      locale: 'pt',
      sort: 'order',
      limit: 200,
    }),
  ]);

  return (
    <ContentManagerClient
      initialRooms={
        roomsResult.docs as unknown as Parameters<typeof ContentManagerClient>[0]['initialRooms']
      }
      initialGallery={
        galleryResult.docs as unknown as Parameters<
          typeof ContentManagerClient
        >[0]['initialGallery']
      }
    />
  );
}
