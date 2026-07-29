'use client';

import { useEffect, useRef } from 'react';
import { trackViewItem } from '@hotel-paraiso/tracking';

export function RoomViewTracker({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackViewItem({ room_slug: slug, room_name: name, price });
      tracked.current = true;
    }
  }, [slug, name, price]);

  return null;
}
