'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './content-manager.module.css';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface MediaSize {
  url?: string | null;
  width?: number | null;
  height?: number | null;
  filesize?: number | null;
}

interface MediaItem {
  id: number;
  url?: string;
  alt?: string;
  filename?: string;
  filesize?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  createdAt?: string;
  sizes?: {
    thumbnail?: MediaSize;
    card?: MediaSize;
    hero?: MediaSize;
  };
}

interface RoomGalleryItem {
  id?: string;
  image: MediaItem | number;
}

interface Amenity {
  name: string;
  icon?: string;
}

interface Room {
  id: number;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  startingPrice?: string;
  shortDescription?: string;
  longDescription?: string;
  featuredImage?: MediaItem | number | null;
  gallery?: RoomGalleryItem[];
  amenities?: Amenity[];
  capacityLabel?: string;
  capacity?: { adults?: number; children?: number };
  size?: number;
  displayOrder?: number;
  seo?: { title?: string; description?: string };
}

interface GalleryItem {
  id: number;
  title: string;
  category: 'rooms' | 'common' | 'restaurant';
  image: MediaItem | number;
  order: number;
}

interface Experience {
  id: number;
  name: string;
  slug: string;
  status: 'draft' | 'published';
  category?: 'gastronomy' | 'leisure' | 'wellness' | 'adventure' | 'cultural';
  shortDescription?: string;
  featuredImage?: MediaItem | number | null;
  gallery?: RoomGalleryItem[];
}

interface SettingsData {
  hotelName?: string;
  tagline?: string;
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
  };
  social?: {
    instagram?: string;
    facebook?: string;
    tripadvisor?: string;
    booking?: string;
  };
  policies?: {
    checkinTime?: string;
    checkoutTime?: string;
  };
  logo?: MediaItem | number | null;
  favicon?: MediaItem | number | null;
}

interface UploadItem {
  file: File;
  originalSize: number;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  mediaId?: number;
  thumbUrl?: string;
  processedSize?: number;
  lowRes?: boolean;
}

type SectionType = 'rooms' | 'gallery' | 'experiences' | 'settings' | 'media';

interface Props {
  initialRooms: Room[];
  initialGallery: GalleryItem[];
  initialExperiences: Experience[];
  initialSettings: SettingsData;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function getMediaUrl(
  media: MediaItem | number | null | undefined,
  size?: 'thumbnail' | 'card' | 'hero'
): string {
  if (!media || typeof media === 'number') return '';
  if (size && media.sizes?.[size]?.url) return media.sizes[size]?.url ?? '';
  return media.url || '';
}

function getMediaAlt(media: MediaItem | number | null | undefined): string {
  if (!media || typeof media === 'number') return '';
  return media.alt || '';
}

function getMediaId(media: MediaItem | number | null | undefined): number | null {
  if (!media) return null;
  if (typeof media === 'number') return media;
  return media.id;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  tv: '📺',
  ac: '❄️',
  minibar: '🍷',
  frigobar: '🍷',
  bathrobe: '👘',
  slippers: '👘',
  room_service: '🍽️',
  view: '🌄',
  desk: '💼',
  usb: '🔌',
  fan: '🌀',
  shower: '🚿',
  towels: '🛁',
  premium: '✨',
  living_room: '🛋️',
};

function getAmenityIcon(icon?: string, name?: string): string {
  if (icon && AMENITY_ICONS[icon]) return AMENITY_ICONS[icon];
  const lower = (name || '').toLowerCase();
  if (lower.includes('wi-fi') || lower.includes('wifi')) return '📶';
  if (lower.includes('ar-condicionado') || lower.includes('ar condicionado')) return '❄️';
  if (lower.includes('tv')) return '📺';
  if (lower.includes('minibar') || lower.includes('frigobar')) return '🍷';
  if (lower.includes('roupão') || lower.includes('chinelo')) return '👘';
  if (lower.includes('room service')) return '🍽️';
  if (lower.includes('vista')) return '🌄';
  if (lower.includes('sala')) return '🛋️';
  if (lower.includes('mesa') || lower.includes('trabalho')) return '💼';
  if (lower.includes('usb') || lower.includes('tomada')) return '🔌';
  if (lower.includes('ventilador')) return '🌀';
  if (lower.includes('chuveiro') || lower.includes('ducha')) return '🚿';
  if (lower.includes('toalha') || lower.includes('roupa de cama')) return '🛁';
  if (lower.includes('premium') || lower.includes('amenities')) return '✨';
  return '✓';
}

const CATEGORY_LABELS: Record<string, string> = {
  gastronomy: 'Gastronomia',
  leisure: 'Lazer',
  wellness: 'Bem-estar',
  adventure: 'Aventura',
  cultural: 'Cultural',
};

const CATEGORY_ICONS: Record<string, string> = {
  gastronomy: '🍽️',
  leisure: '🏖️',
  wellness: '🧖',
  adventure: '🏔️',
  cultural: '🎭',
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function ContentManagerClient({
  initialRooms,
  initialGallery,
  initialExperiences,
  initialSettings,
}: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionType>('rooms');
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [expandedExperience, setExpandedExperience] = useState<number | null>(null);
  const [previewRoom, setPreviewRoom] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savedGlobal, setSavedGlobal] = useState(false);

  // Room SEO collapsible
  const [seoOpenRooms, setSeoOpenRooms] = useState<Record<number, boolean>>({});

  // Room amenity input
  const [amenityInput, setAmenityInput] = useState<Record<number, string>>({});

  // Gallery inline edit
  const [editingGalleryTitle, setEditingGalleryTitle] = useState<number | null>(null);
  const [galleryTitleDraft, setGalleryTitleDraft] = useState('');

  // Media alt edit
  const [editingMediaAlt, setEditingMediaAlt] = useState<number | null>(null);
  const [mediaAltDraft, setMediaAltDraft] = useState('');

  // Upload state
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const [dropzoneTarget, setDropzoneTarget] = useState<
    | { type: 'room'; roomId: number }
    | { type: 'gallery'; category: string }
    | { type: 'experience'; experienceId: number }
    | { type: 'media' }
    | null
  >(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Editing state
  const [editFields, setEditFields] = useState<Record<number, Record<string, unknown>>>({});
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* ─── Load media on demand ─── */
  useEffect(() => {
    if (activeSection === 'media' && !mediaLoaded) {
      fetch('/api/media?depth=0&locale=pt&sort=-createdAt&limit=100')
        .then((res) => res.json())
        .then((data) => {
          setMediaItems(data.docs);
          setMediaLoaded(true);
        });
    }
  }, [activeSection, mediaLoaded]);

  /* ─── Data refresh ─── */
  const refreshRooms = useCallback(async () => {
    const res = await fetch('/api/rooms?depth=2&locale=pt&sort=displayOrder&limit=50');
    const data = await res.json();
    setRooms(data.docs);
  }, []);

  const refreshGallery = useCallback(async () => {
    const res = await fetch('/api/gallery?depth=2&locale=pt&sort=order&limit=200');
    const data = await res.json();
    setGallery(data.docs);
  }, []);

  const refreshExperiences = useCallback(async () => {
    const res = await fetch('/api/experiences?depth=2&locale=pt&sort=name&limit=50');
    const data = await res.json();
    setExperiences(data.docs);
  }, []);

  const refreshMedia = useCallback(async () => {
    const res = await fetch('/api/media?depth=0&locale=pt&sort=-createdAt&limit=100');
    const data = await res.json();
    setMediaItems(data.docs);
  }, []);

  /* ─── Room field editing with debounced save ─── */
  const updateRoomField = useCallback((roomId: number, field: string, value: string) => {
    setEditFields((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value },
    }));

    const key = `${roomId}-${field}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      setSaving(roomId);
      await fetch(`/api/rooms/${roomId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setSaving(null);
      setSavedId(roomId);
      setTimeout(() => setSavedId(null), 2000);
    }, 800);
  }, []);

  /* ─── Room nested field editing (capacity, seo) ─── */
  const updateRoomNestedField = useCallback(
    (roomId: number, group: string, field: string, value: string | number) => {
      setEditFields((prev) => {
        const existing = (prev[roomId]?.[group] as Record<string, unknown>) || {};
        return {
          ...prev,
          [roomId]: {
            ...prev[roomId],
            [group]: { ...existing, [field]: value },
          },
        };
      });

      const key = `${roomId}-${group}.${field}`;
      if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(async () => {
        const room = rooms.find((r) => r.id === roomId);
        const currentGroup = (room?.[group as keyof Room] as Record<string, unknown>) || {};
        const editGroup = (editFields[roomId]?.[group] as Record<string, unknown>) || {};

        setSaving(roomId);
        await fetch(`/api/rooms/${roomId}?locale=pt`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [group]: { ...currentGroup, ...editGroup, [field]: value },
          }),
        });
        setSaving(null);
        setSavedId(roomId);
        setTimeout(() => setSavedId(null), 2000);
      }, 800);
    },
    [rooms, editFields]
  );

  /* ─── Room status toggle ─── */
  const toggleRoomStatus = useCallback(
    async (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      const newStatus = room.status === 'published' ? 'draft' : 'published';

      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)));

      setSaving(roomId);
      await fetch(`/api/rooms/${roomId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setSaving(null);
      setSavedId(roomId);
      setTimeout(() => setSavedId(null), 2000);
    },
    [rooms]
  );

  /* ─── Room amenity management ─── */
  const addAmenity = useCallback(
    async (roomId: number, amenityName: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;
      const trimmed = amenityName.trim();
      if (!trimmed) return;

      const newAmenities = [...(room.amenities || []), { name: trimmed }];
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, amenities: newAmenities } : r))
      );
      setAmenityInput((prev) => ({ ...prev, [roomId]: '' }));

      setSaving(roomId);
      await fetch(`/api/rooms/${roomId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenities: newAmenities }),
      });
      setSaving(null);
      setSavedId(roomId);
      setTimeout(() => setSavedId(null), 2000);
    },
    [rooms]
  );

  const removeAmenity = useCallback(
    async (roomId: number, idx: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room?.amenities) return;

      const newAmenities = room.amenities.filter((_, i) => i !== idx);
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, amenities: newAmenities } : r))
      );

      setSaving(roomId);
      await fetch(`/api/rooms/${roomId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenities: newAmenities }),
      });
      setSaving(null);
      setSavedId(roomId);
      setTimeout(() => setSavedId(null), 2000);
    },
    [rooms]
  );

  /* ─── Set cover photo ─── */
  const setCoverPhoto = useCallback(
    async (roomId: number, mediaId: number) => {
      setSaving(roomId);
      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredImage: mediaId }),
      });
      await refreshRooms();
      setSaving(null);
      setSavedId(roomId);
      setTimeout(() => setSavedId(null), 2000);
    },
    [refreshRooms]
  );

  /* ─── Reorder room gallery ─── */
  const reorderRoomGallery = useCallback(
    async (roomId: number, fromIdx: number, toIdx: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room?.gallery) return;

      const newGallery = [...room.gallery];
      const moved = newGallery.splice(fromIdx, 1)[0];
      if (!moved) return;
      newGallery.splice(toIdx, 0, moved);

      // Optimistic update
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, gallery: newGallery } : r)));

      // Persist — send array of image IDs
      const galleryPayload = newGallery.map((item) => ({
        image: getMediaId(item.image),
      }));

      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: galleryPayload }),
      });
    },
    [rooms]
  );

  /* ─── Remove photo from room gallery ─── */
  const removeFromGallery = useCallback(
    async (roomId: number, idx: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room?.gallery) return;

      const newGallery = room.gallery.filter((_, i) => i !== idx);
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, gallery: newGallery } : r)));

      const galleryPayload = newGallery.map((item) => ({
        image: getMediaId(item.image),
      }));

      await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: galleryPayload }),
      });
    },
    [rooms]
  );

  /* ─── Experience field editing with debounced save ─── */
  const updateExperienceField = useCallback((expId: number, field: string, value: string) => {
    setEditFields((prev) => ({
      ...prev,
      [expId]: { ...prev[expId], [field]: value },
    }));

    const key = `exp-${expId}-${field}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      setSaving(expId);
      await fetch(`/api/experiences/${expId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      setSaving(null);
      setSavedId(expId);
      setTimeout(() => setSavedId(null), 2000);
    }, 800);
  }, []);

  /* ─── Experience status toggle ─── */
  const toggleExperienceStatus = useCallback(
    async (expId: number) => {
      const exp = experiences.find((e) => e.id === expId);
      if (!exp) return;
      const newStatus = exp.status === 'published' ? 'draft' : 'published';

      setExperiences((prev) => prev.map((e) => (e.id === expId ? { ...e, status: newStatus } : e)));

      setSaving(expId);
      await fetch(`/api/experiences/${expId}?locale=pt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setSaving(null);
      setSavedId(expId);
      setTimeout(() => setSavedId(null), 2000);
    },
    [experiences]
  );

  /* ─── Experience gallery reorder ─── */
  const reorderExperienceGallery = useCallback(
    async (expId: number, fromIdx: number, toIdx: number) => {
      const exp = experiences.find((e) => e.id === expId);
      if (!exp?.gallery) return;

      const newGallery = [...exp.gallery];
      const moved = newGallery.splice(fromIdx, 1)[0];
      if (!moved) return;
      newGallery.splice(toIdx, 0, moved);

      setExperiences((prev) =>
        prev.map((e) => (e.id === expId ? { ...e, gallery: newGallery } : e))
      );

      const galleryPayload = newGallery.map((item) => ({
        image: getMediaId(item.image),
      }));

      await fetch(`/api/experiences/${expId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: galleryPayload }),
      });
    },
    [experiences]
  );

  /* ─── Remove photo from experience gallery ─── */
  const removeFromExperienceGallery = useCallback(
    async (expId: number, idx: number) => {
      const exp = experiences.find((e) => e.id === expId);
      if (!exp?.gallery) return;

      const newGallery = exp.gallery.filter((_, i) => i !== idx);
      setExperiences((prev) =>
        prev.map((e) => (e.id === expId ? { ...e, gallery: newGallery } : e))
      );

      const galleryPayload = newGallery.map((item) => ({
        image: getMediaId(item.image),
      }));

      await fetch(`/api/experiences/${expId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: galleryPayload }),
      });
    },
    [experiences]
  );

  /* ─── Gallery delete item ─── */
  const deleteGalleryItem = useCallback(async (itemId: number) => {
    setGallery((prev) => prev.filter((g) => g.id !== itemId));
    await fetch(`/api/gallery/${itemId}`, { method: 'DELETE' });
  }, []);

  /* ─── Gallery edit title ─── */
  const saveGalleryTitle = useCallback(async (itemId: number, newTitle: string) => {
    setGallery((prev) => prev.map((g) => (g.id === itemId ? { ...g, title: newTitle } : g)));
    setEditingGalleryTitle(null);

    await fetch(`/api/gallery/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
  }, []);

  /* ─── Gallery create new item ─── */
  const createGalleryItem = useCallback(
    async (mediaId: number, title: string, category: string) => {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          image: mediaId,
          order: gallery.filter((g) => g.category === category).length,
        }),
      });
      if (res.ok) {
        await refreshGallery();
      }
    },
    [gallery, refreshGallery]
  );

  /* ─── Settings editing with debounced save ─── */
  const updateSettingsField = useCallback(
    (path: string, value: string) => {
      setSettingsEdits((prev) => ({ ...prev, [path]: value }));

      const key = `settings-${path}`;
      if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(async () => {
        setSavingGlobal(true);

        // Build nested object from dot path
        const parts = path.split('.');
        const body: Record<string, unknown> = {};
        if (parts.length === 1) {
          body[parts[0] as string] = value;
        } else if (parts.length === 2) {
          const group = parts[0] as string;
          const field = parts[1] as string;
          // Merge with current settings group
          const currentGroup =
            (settings[group as keyof SettingsData] as Record<string, unknown>) || {};
          body[group] = { ...currentGroup, [field]: value };
        }

        await fetch('/api/globals/settings?locale=pt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        // Refresh settings
        const res = await fetch('/api/globals/settings?locale=pt');
        const data = await res.json();
        setSettings(data);

        setSavingGlobal(false);
        setSavedGlobal(true);
        setTimeout(() => setSavedGlobal(false), 2000);
      }, 800);
    },
    [settings]
  );

  /* ─── Media delete ─── */
  const deleteMediaItem = useCallback(async (mediaId: number) => {
    setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    await fetch(`/api/media/${mediaId}`, { method: 'DELETE' });
  }, []);

  /* ─── Media alt edit ─── */
  const saveMediaAlt = useCallback(async (mediaId: number, alt: string) => {
    setMediaItems((prev) => prev.map((m) => (m.id === mediaId ? { ...m, alt } : m)));
    setEditingMediaAlt(null);
    await fetch(`/api/media/${mediaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt }),
    });
  }, []);

  /* ─── Upload files ─── */
  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (!fileArray.length) return;

      setDropzoneOpen(false);
      setShowUploadPanel(true);

      const newUploads: UploadItem[] = fileArray.map((file) => ({
        file,
        originalSize: file.size,
        progress: 0,
        status: 'uploading' as const,
        lowRes: false,
      }));
      setUploads(newUploads);

      // Check resolution for each file
      for (const upload of newUploads) {
        const img = new Image();
        const url = URL.createObjectURL(upload.file);
        img.src = url;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            if (img.width < 1200) {
              upload.lowRes = true;
              setUploads([...newUploads]);
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
        });
      }

      // Upload each file
      for (const upload of newUploads) {
        try {
          const formData = new FormData();
          formData.append('file', upload.file);
          formData.append('alt', upload.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));

          upload.progress = 30;
          setUploads([...newUploads]);

          const res = await fetch('/api/media', { method: 'POST', body: formData });

          upload.progress = 90;
          setUploads([...newUploads]);

          if (res.ok) {
            const mediaRes = await res.json();
            upload.status = 'done';
            upload.progress = 100;
            upload.mediaId = mediaRes.doc.id;
            upload.thumbUrl = mediaRes.doc.sizes?.thumbnail?.url || mediaRes.doc.url;
            upload.processedSize = mediaRes.doc.sizes?.thumbnail?.filesize || mediaRes.doc.filesize;

            // Add to room gallery if target is a room
            if (dropzoneTarget?.type === 'room') {
              const room = rooms.find((r) => r.id === dropzoneTarget.roomId);
              if (room) {
                const currentGallery = (room.gallery || []).map((item) => ({
                  image: getMediaId(item.image),
                }));
                currentGallery.push({ image: mediaRes.doc.id });

                await fetch(`/api/rooms/${dropzoneTarget.roomId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gallery: currentGallery }),
                });
              }
            }

            // Add to experience gallery if target is an experience
            if (dropzoneTarget?.type === 'experience') {
              const exp = experiences.find((e) => e.id === dropzoneTarget.experienceId);
              if (exp) {
                const currentGallery = (exp.gallery || []).map((item) => ({
                  image: getMediaId(item.image),
                }));
                currentGallery.push({ image: mediaRes.doc.id });

                await fetch(`/api/experiences/${dropzoneTarget.experienceId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gallery: currentGallery }),
                });
              }
            }

            // Create gallery record if target is gallery category
            if (dropzoneTarget?.type === 'gallery') {
              const title = upload.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
              await createGalleryItem(mediaRes.doc.id, title, dropzoneTarget.category);
            }
          } else {
            upload.status = 'error';
            upload.progress = 100;
          }
        } catch {
          upload.status = 'error';
          upload.progress = 100;
        }
        setUploads([...newUploads]);
      }

      // Refresh data
      await refreshRooms();
      await refreshGallery();
      await refreshExperiences();
      if (mediaLoaded) {
        await refreshMedia();
      }
    },
    [
      dropzoneTarget,
      rooms,
      experiences,
      refreshRooms,
      refreshGallery,
      refreshExperiences,
      refreshMedia,
      mediaLoaded,
      createGalleryItem,
    ]
  );

  /* ─── Drag handlers for photo grid ─── */
  const onDragStart = (idx: number) => {
    dragItem.current = idx;
  };
  const onDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };

  const onDragEnd = (roomId: number) => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      reorderRoomGallery(roomId, dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  /* ─── Gallery drag handlers ─── */
  const reorderGalleryItem = useCallback(
    async (category: string, fromIdx: number, toIdx: number) => {
      const catItems = gallery
        .filter((g) => g.category === category)
        .sort((a, b) => a.order - b.order);

      const moved = catItems.splice(fromIdx, 1)[0];
      if (!moved) return;
      catItems.splice(toIdx, 0, moved);

      // Update order for all items in category
      const updates = catItems.map((item, idx) => ({
        id: item.id,
        order: idx,
      }));

      // Optimistic update
      setGallery((prev) => {
        const other = prev.filter((g) => g.category !== category);
        const reordered = catItems.map((item, idx) => ({ ...item, order: idx }));
        return [...other, ...reordered];
      });

      // Persist
      await Promise.all(
        updates.map(({ id, order }) =>
          fetch(`/api/gallery/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order }),
          })
        )
      );
    },
    [gallery]
  );

  /* ─── Helper to get settings value with edits ─── */
  const getSettingsValue = useCallback(
    (path: string): string => {
      if (path in settingsEdits) return settingsEdits[path] as string;
      const parts = path.split('.');
      if (parts.length === 1) {
        return (settings[parts[0] as keyof SettingsData] as string) || '';
      }
      if (parts.length === 2) {
        const group = settings[parts[0] as keyof SettingsData] as
          | Record<string, unknown>
          | undefined;
        return (group?.[parts[1] as string] as string) || '';
      }
      return '';
    },
    [settings, settingsEdits]
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  const galleryByCategory = {
    common: gallery.filter((g) => g.category === 'common').sort((a, b) => a.order - b.order),
    restaurant: gallery
      .filter((g) => g.category === 'restaurant')
      .sort((a, b) => a.order - b.order),
    rooms: gallery.filter((g) => g.category === 'rooms').sort((a, b) => a.order - b.order),
  };

  const totalGallery = gallery.length;

  return (
    <div className={styles.layout}>
      {/* ─── Sidebar ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <h1>Hotel Paraíso</h1>
          <span>Content Manager</span>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Conteúdo</div>
            <button
              className={`${styles.sidebarLink} ${activeSection === 'rooms' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveSection('rooms')}
            >
              🏨 Quartos
            </button>
            <button
              className={`${styles.sidebarLink} ${activeSection === 'gallery' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveSection('gallery')}
            >
              🖼️ Galeria
            </button>
            <button
              className={`${styles.sidebarLink} ${activeSection === 'experiences' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveSection('experiences')}
            >
              🌟 Experiências
            </button>
            <button
              className={`${styles.sidebarLink} ${activeSection === 'media' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveSection('media')}
            >
              📁 Mídias
            </button>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Sistema</div>
            <button
              className={`${styles.sidebarLink} ${activeSection === 'settings' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              ⚙️ Configurações
            </button>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Avançado</div>
            <a
              href="/admin/collections/pages"
              className={styles.sidebarLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Páginas
            </a>
            <a
              href="/admin/collections/blog-posts"
              className={styles.sidebarLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              ✍️ Blog
            </a>
            <a
              href="/admin/collections/users"
              className={styles.sidebarLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              👥 Usuários
            </a>
          </div>
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionTitle}>Navegação</div>
            <a href="/admin" className={styles.sidebarLink}>
              ← Voltar ao Payload
            </a>
          </div>
        </nav>
      </aside>

      {/* ─── Main ─── */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.breadcrumb}>
            <a href="/admin">Admin</a>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Gestão de Conteúdo</span>
          </div>
        </header>

        <div className={styles.page}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.pageTitle}>Gestão de Conteúdo</h2>
              <p className={styles.pageSubtitle}>Gerencie quartos, fotos e informações do hotel</p>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeSection === 'rooms' ? styles.tabActive : ''}`}
              onClick={() => setActiveSection('rooms')}
            >
              Quartos <span className={styles.tabBadge}>{rooms.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeSection === 'gallery' ? styles.tabActive : ''}`}
              onClick={() => setActiveSection('gallery')}
            >
              Galeria <span className={styles.tabBadge}>{totalGallery}</span>
            </button>
            <button
              className={`${styles.tab} ${activeSection === 'experiences' ? styles.tabActive : ''}`}
              onClick={() => setActiveSection('experiences')}
            >
              Experiências <span className={styles.tabBadge}>{experiences.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeSection === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              Configurações
            </button>
            <button
              className={`${styles.tab} ${activeSection === 'media' ? styles.tabActive : ''}`}
              onClick={() => setActiveSection('media')}
            >
              Mídias
            </button>
          </div>

          {/* ═══ ROOMS SECTION ═══ */}
          {activeSection === 'rooms' && (
            <div>
              {/* Alert for rooms without photos */}
              {rooms
                .filter((r) => !r.gallery?.length)
                .map((r) => (
                  <div key={r.id} className={styles.alertWarning}>
                    <span>⚠️</span>
                    <span>
                      <strong>{r.name}</strong> tem 0 fotos. Recomendamos pelo menos 3 fotos por
                      categoria.
                    </span>
                  </div>
                ))}

              {rooms.map((room) => {
                const isExpanded = expandedRoom === room.id;
                const isPreview = previewRoom === room.id;
                const edits = editFields[room.id] || {};
                const featuredId = getMediaId(room.featuredImage);
                const photoCount = room.gallery?.length || 0;
                const seoEdits = (edits.seo as Record<string, string>) || {};
                const capacityEdits = (edits.capacity as Record<string, unknown>) || {};
                const seoOpen = seoOpenRooms[room.id] || false;

                return (
                  <div
                    key={room.id}
                    className={`${styles.roomCard} ${isExpanded ? styles.roomCardExpanded : ''}`}
                  >
                    {/* Card header */}
                    <div
                      className={styles.roomCardHeader}
                      onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                    >
                      <div className={styles.roomThumb}>
                        {room.featuredImage && typeof room.featuredImage !== 'number' ? (
                          <img src={getMediaUrl(room.featuredImage, 'thumbnail')} alt={room.name} />
                        ) : (
                          <span className={styles.roomThumbEmpty}>📷</span>
                        )}
                      </div>
                      <div className={styles.roomCardInfo}>
                        <div className={styles.roomCardName}>
                          {room.name}
                          <span
                            className={
                              room.status === 'published'
                                ? styles.statusPublished
                                : styles.statusDraft
                            }
                          >
                            {room.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        <div className={styles.roomCardMeta}>
                          {room.size && <span>{room.size}m²</span>}
                          {room.capacityLabel && (
                            <>
                              <span className={styles.sep}>·</span>
                              <span>{room.capacityLabel}</span>
                            </>
                          )}
                          {room.startingPrice && (
                            <>
                              <span className={styles.sep}>·</span>
                              <span>{room.startingPrice}</span>
                            </>
                          )}
                          {room.amenities && (
                            <>
                              <span className={styles.sep}>·</span>
                              <span>{room.amenities.length} amenidades</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.roomCardStats}>
                        <div className={styles.stat}>
                          <div
                            className={`${styles.statValue} ${photoCount >= 3 ? styles.photoCountOk : styles.photoCountWarn}`}
                          >
                            {photoCount}
                          </div>
                          <div className={styles.statLabel}>Fotos</div>
                        </div>
                      </div>
                      <div
                        className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}
                      >
                        ▼
                      </div>
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div className={styles.roomCardBody}>
                        <div
                          className={`${styles.roomBodyGrid} ${isPreview ? styles.roomBodyGridPreview : ''}`}
                        >
                          {/* Left: Photos */}
                          <div>
                            <div className={styles.photoSectionHeader}>
                              <span className={styles.photoSectionTitle}>Fotos ({photoCount})</span>
                              <div className={styles.photoSectionActions}>
                                <button
                                  className={`${styles.previewToggle} ${isPreview ? styles.previewToggleActive : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewRoom(isPreview ? null : room.id);
                                  }}
                                >
                                  {isPreview ? '✕ Fechar preview' : '👁️ Preview do site'}
                                </button>
                                <button
                                  className={styles.btnSecondary}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDropzoneTarget({ type: 'room', roomId: room.id });
                                    setDropzoneOpen(true);
                                  }}
                                >
                                  + Upload
                                </button>
                              </div>
                            </div>

                            <div className={styles.dragHint}>
                              ↕️ Arraste as fotos para reordenar. Clique na ★ para definir como
                              capa.
                            </div>

                            <div className={styles.photoGrid}>
                              {room.gallery?.map((item, idx) => {
                                const media = item.image as MediaItem;
                                const isCover = getMediaId(item.image) === featuredId;
                                return (
                                  <div
                                    key={item.id || idx}
                                    className={`${styles.photoItem} ${isCover ? styles.photoItemCover : ''}`}
                                    draggable
                                    onDragStart={() => onDragStart(idx)}
                                    onDragEnter={() => onDragEnter(idx)}
                                    onDragEnd={() => onDragEnd(room.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                  >
                                    <img
                                      src={getMediaUrl(media, 'thumbnail')}
                                      alt={getMediaAlt(media)}
                                    />
                                    <div className={styles.photoItemOverlay}>
                                      {isCover && <div className={styles.coverBadge}>★ Capa</div>}
                                      {!isCover && <div />}
                                      <div className={styles.photoItemActions}>
                                        {!isCover && (
                                          <button
                                            className={styles.photoActionBtn}
                                            title="Definir como capa"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCoverPhoto(room.id, getMediaId(media) as number);
                                            }}
                                          >
                                            ★
                                          </button>
                                        )}
                                        <button
                                          className={`${styles.photoActionBtn} ${styles.photoActionDelete}`}
                                          title="Remover"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromGallery(room.id, idx);
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.photoOrder}>{idx + 1}</div>
                                  </div>
                                );
                              })}

                              {/* Add button */}
                              <div
                                className={styles.photoAdd}
                                onClick={() => {
                                  setDropzoneTarget({ type: 'room', roomId: room.id });
                                  setDropzoneOpen(true);
                                }}
                              >
                                <span className={styles.photoAddPlus}>+</span>
                                <span>Adicionar fotos</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Info Panel OR Preview */}
                          {isPreview ? (
                            <div className={styles.previewPanel}>
                              <div className={styles.previewToolbar}>
                                <div className={styles.previewToolbarLeft}>
                                  <span className={styles.previewDot} />
                                  <span>Preview ao vivo</span>
                                </div>
                                <div className={styles.previewDevices}>
                                  <button
                                    className={`${styles.previewDeviceBtn} ${styles.previewDeviceBtnActive}`}
                                  >
                                    🖥️
                                  </button>
                                  <button className={styles.previewDeviceBtn}>📱</button>
                                </div>
                              </div>
                              <div className={styles.previewBody}>
                                <div className={styles.siteRoomCard}>
                                  {room.featuredImage && typeof room.featuredImage !== 'number' && (
                                    <img
                                      className={styles.siteRoomHero}
                                      src={getMediaUrl(room.featuredImage, 'card')}
                                      alt={room.name}
                                    />
                                  )}
                                  {room.gallery && room.gallery.length > 0 && (
                                    <div className={styles.siteRoomGalleryStrip}>
                                      {room.gallery.slice(0, 8).map((item, idx) => (
                                        <img
                                          key={idx}
                                          src={getMediaUrl(item.image as MediaItem, 'thumbnail')}
                                          alt=""
                                        />
                                      ))}
                                    </div>
                                  )}
                                  <div className={styles.siteRoomContent}>
                                    <div className={styles.siteRoomName}>{room.name}</div>
                                    <div className={styles.siteRoomPrice}>
                                      {(edits.startingPrice as string) ?? room.startingPrice}
                                    </div>
                                    <div className={styles.siteRoomDesc}>
                                      {(edits.shortDescription as string) ?? room.shortDescription}
                                    </div>
                                    <div className={styles.siteRoomDescFull}>
                                      {(edits.longDescription as string) ?? room.longDescription}
                                    </div>
                                    {room.amenities && (
                                      <div className={styles.siteRoomAmenities}>
                                        {room.amenities.map((a, i) => (
                                          <span key={i} className={styles.siteAmenity}>
                                            {getAmenityIcon(a.icon, a.name)} {a.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <button className={styles.siteRoomCta}>Reservar agora</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.infoPanel}>
                              {/* Name */}
                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Nome</label>
                                <input
                                  className={styles.infoEditable}
                                  type="text"
                                  value={(edits.name as string) ?? room.name ?? ''}
                                  onChange={(e) => updateRoomField(room.id, 'name', e.target.value)}
                                />
                              </div>

                              {/* Status toggle */}
                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Status</label>
                                <button
                                  className={`${styles.statusToggle} ${
                                    room.status === 'published'
                                      ? styles.statusTogglePublished
                                      : styles.statusToggleDraft
                                  }`}
                                  onClick={() => toggleRoomStatus(room.id)}
                                >
                                  <span className={styles.statusToggleDot} />
                                  {room.status === 'published' ? 'Publicado' : 'Rascunho'}
                                </button>
                              </div>

                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Descrição curta</label>
                                <textarea
                                  className={styles.infoEditable}
                                  rows={2}
                                  value={
                                    (edits.shortDescription as string) ??
                                    room.shortDescription ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    updateRoomField(room.id, 'shortDescription', e.target.value)
                                  }
                                />
                              </div>

                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Descrição completa</label>
                                <textarea
                                  className={styles.infoEditable}
                                  rows={4}
                                  value={
                                    (edits.longDescription as string) ?? room.longDescription ?? ''
                                  }
                                  onChange={(e) =>
                                    updateRoomField(room.id, 'longDescription', e.target.value)
                                  }
                                />
                              </div>

                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Preço inicial</label>
                                <input
                                  className={styles.infoEditable}
                                  type="text"
                                  value={
                                    (edits.startingPrice as string) ?? room.startingPrice ?? ''
                                  }
                                  onChange={(e) =>
                                    updateRoomField(room.id, 'startingPrice', e.target.value)
                                  }
                                />
                              </div>

                              {/* Capacity */}
                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Capacidade</label>
                                <input
                                  className={styles.infoEditable}
                                  type="text"
                                  placeholder="Ex: 1-2 adultos"
                                  value={
                                    (edits.capacityLabel as string) ?? room.capacityLabel ?? ''
                                  }
                                  onChange={(e) =>
                                    updateRoomField(room.id, 'capacityLabel', e.target.value)
                                  }
                                />
                                <div className={styles.infoRow}>
                                  <div className={styles.infoGroup}>
                                    <label className={styles.infoLabel}>Adultos</label>
                                    <input
                                      className={styles.infoEditable}
                                      type="number"
                                      min={1}
                                      value={
                                        (capacityEdits.adults as number) ??
                                        room.capacity?.adults ??
                                        2
                                      }
                                      onChange={(e) =>
                                        updateRoomNestedField(
                                          room.id,
                                          'capacity',
                                          'adults',
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                    />
                                  </div>
                                  <div className={styles.infoGroup}>
                                    <label className={styles.infoLabel}>Crianças</label>
                                    <input
                                      className={styles.infoEditable}
                                      type="number"
                                      min={0}
                                      value={
                                        (capacityEdits.children as number) ??
                                        room.capacity?.children ??
                                        1
                                      }
                                      onChange={(e) =>
                                        updateRoomNestedField(
                                          room.id,
                                          'capacity',
                                          'children',
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className={styles.infoRow}>
                                <div className={styles.infoGroup}>
                                  <div className={styles.infoLabel}>Tamanho</div>
                                  <div className={styles.infoValue}>{room.size}m²</div>
                                </div>
                              </div>

                              {/* Amenities management */}
                              <div className={styles.infoGroup}>
                                <div className={styles.infoLabel}>Amenidades</div>
                                <div className={styles.amenityList}>
                                  {room.amenities?.map((a, i) => (
                                    <span key={i} className={styles.amenityTagEditable}>
                                      {getAmenityIcon(a.icon, a.name)} {a.name}
                                      <button
                                        className={styles.amenityRemove}
                                        onClick={() => removeAmenity(room.id, i)}
                                        title="Remover"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))}
                                </div>
                                <div className={styles.amenityAddRow}>
                                  <input
                                    className={styles.amenityAddInput}
                                    type="text"
                                    placeholder="Nova amenidade..."
                                    value={amenityInput[room.id] || ''}
                                    onChange={(e) =>
                                      setAmenityInput((prev) => ({
                                        ...prev,
                                        [room.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addAmenity(room.id, amenityInput[room.id] || '');
                                      }
                                    }}
                                  />
                                  <button
                                    className={styles.btnSecondary}
                                    onClick={() => addAmenity(room.id, amenityInput[room.id] || '')}
                                  >
                                    + Adicionar
                                  </button>
                                </div>
                              </div>

                              {/* SEO collapsible */}
                              <div className={styles.seoSection}>
                                <button
                                  className={styles.seoToggle}
                                  onClick={() =>
                                    setSeoOpenRooms((prev) => ({
                                      ...prev,
                                      [room.id]: !prev[room.id],
                                    }))
                                  }
                                >
                                  <span>🔍 SEO</span>
                                  <span
                                    className={`${styles.seoChevron} ${seoOpen ? styles.seoChevronOpen : ''}`}
                                  >
                                    ▼
                                  </span>
                                </button>
                                {seoOpen && (
                                  <div className={styles.seoBody}>
                                    <div className={styles.infoGroup}>
                                      <label className={styles.infoLabel}>SEO Title</label>
                                      <input
                                        className={styles.infoEditable}
                                        type="text"
                                        value={seoEdits.title ?? room.seo?.title ?? ''}
                                        onChange={(e) =>
                                          updateRoomNestedField(
                                            room.id,
                                            'seo',
                                            'title',
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <div className={styles.infoGroup}>
                                      <label className={styles.infoLabel}>SEO Description</label>
                                      <textarea
                                        className={styles.infoEditable}
                                        rows={3}
                                        value={seoEdits.description ?? room.seo?.description ?? ''}
                                        onChange={(e) =>
                                          updateRoomNestedField(
                                            room.id,
                                            'seo',
                                            'description',
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className={styles.roomCardFooter}>
                                <div className={styles.saveIndicator}>
                                  {saving === room.id ? (
                                    <>
                                      <span className={styles.dotSaving} /> Salvando...
                                    </>
                                  ) : savedId === room.id ? (
                                    <>
                                      <span className={styles.dotSaved} /> Salvo
                                    </>
                                  ) : (
                                    <>
                                      <span className={styles.dotIdle} /> Pronto
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ GALLERY SECTION ═══ */}
          {activeSection === 'gallery' && (
            <div>
              <div className={styles.dragHint}>
                ↕️ Arraste as fotos para reordenar dentro de cada categoria. A ordem aqui define a
                ordem no site.
              </div>

              {/* Áreas Comuns */}
              <GalleryCategorySection
                title="🏨 Áreas Comuns"
                items={galleryByCategory.common}
                category="common"
                onReorder={reorderGalleryItem}
                onUpload={() => {
                  setDropzoneTarget({ type: 'gallery', category: 'common' });
                  setDropzoneOpen(true);
                }}
                onDelete={deleteGalleryItem}
                editingTitleId={editingGalleryTitle}
                titleDraft={galleryTitleDraft}
                onStartEditTitle={(id, title) => {
                  setEditingGalleryTitle(id);
                  setGalleryTitleDraft(title);
                }}
                onChangeTitleDraft={setGalleryTitleDraft}
                onSaveTitle={saveGalleryTitle}
                onCancelEditTitle={() => setEditingGalleryTitle(null)}
              />

              {/* Restaurante */}
              <GalleryCategorySection
                title="🍽️ Restaurante"
                items={galleryByCategory.restaurant}
                category="restaurant"
                onReorder={reorderGalleryItem}
                onUpload={() => {
                  setDropzoneTarget({ type: 'gallery', category: 'restaurant' });
                  setDropzoneOpen(true);
                }}
                onDelete={deleteGalleryItem}
                editingTitleId={editingGalleryTitle}
                titleDraft={galleryTitleDraft}
                onStartEditTitle={(id, title) => {
                  setEditingGalleryTitle(id);
                  setGalleryTitleDraft(title);
                }}
                onChangeTitleDraft={setGalleryTitleDraft}
                onSaveTitle={saveGalleryTitle}
                onCancelEditTitle={() => setEditingGalleryTitle(null)}
              />

              {/* Quartos overview */}
              <div className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryTitle}>
                    🛏️ Quartos
                    <span className={styles.categoryCount}>
                      {rooms.reduce((acc, r) => acc + (r.gallery?.length || 0), 0)} fotos
                    </span>
                  </div>
                  <span className={styles.categoryHint}>Gerencie na aba &quot;Quartos&quot;</span>
                </div>
                <div className={styles.galleryGrid}>
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={styles.galleryItem}
                      onClick={() => {
                        setActiveSection('rooms');
                        setExpandedRoom(room.id);
                      }}
                    >
                      {room.featuredImage && typeof room.featuredImage !== 'number' ? (
                        <img src={getMediaUrl(room.featuredImage, 'thumbnail')} alt={room.name} />
                      ) : (
                        <div className={styles.galleryItemEmpty}>
                          <span>⚠️</span>
                          <span>{room.name}</span>
                          <span>0 fotos</span>
                        </div>
                      )}
                      <div className={styles.galleryItemOverlayPermanent}>
                        <div className={styles.galleryItemTitle}>
                          {room.name} · {room.gallery?.length || 0} fotos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ EXPERIENCES SECTION ═══ */}
          {activeSection === 'experiences' && (
            <div>
              {experiences.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={styles.emptyStateIcon}>🌟</span>
                  <p>Nenhuma experiência cadastrada.</p>
                  <a href="/admin/collections/experiences/create" className={styles.btnSecondary}>
                    + Criar no Payload
                  </a>
                </div>
              )}

              {experiences.map((exp) => {
                const isExpanded = expandedExperience === exp.id;
                const edits2 = editFields[exp.id] || {};
                const photoCount = exp.gallery?.length || 0;

                return (
                  <div
                    key={exp.id}
                    className={`${styles.roomCard} ${isExpanded ? styles.roomCardExpanded : ''}`}
                  >
                    {/* Card header */}
                    <div
                      className={styles.roomCardHeader}
                      onClick={() => setExpandedExperience(isExpanded ? null : exp.id)}
                    >
                      <div className={styles.roomThumb}>
                        {exp.featuredImage && typeof exp.featuredImage !== 'number' ? (
                          <img src={getMediaUrl(exp.featuredImage, 'thumbnail')} alt={exp.name} />
                        ) : (
                          <span className={styles.roomThumbEmpty}>🌟</span>
                        )}
                      </div>
                      <div className={styles.roomCardInfo}>
                        <div className={styles.roomCardName}>
                          {exp.name}
                          {exp.category && (
                            <span className={styles.categoryBadge}>
                              {CATEGORY_ICONS[exp.category] || ''}{' '}
                              {CATEGORY_LABELS[exp.category] || exp.category}
                            </span>
                          )}
                          <span
                            className={
                              exp.status === 'published'
                                ? styles.statusPublished
                                : styles.statusDraft
                            }
                          >
                            {exp.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        <div className={styles.roomCardMeta}>
                          {exp.shortDescription && (
                            <span>
                              {exp.shortDescription.length > 60
                                ? exp.shortDescription.slice(0, 60) + '...'
                                : exp.shortDescription}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.roomCardStats}>
                        <div className={styles.stat}>
                          <div
                            className={`${styles.statValue} ${photoCount >= 1 ? styles.photoCountOk : styles.photoCountWarn}`}
                          >
                            {photoCount}
                          </div>
                          <div className={styles.statLabel}>Fotos</div>
                        </div>
                      </div>
                      <div
                        className={`${styles.expandIcon} ${isExpanded ? styles.expandIconOpen : ''}`}
                      >
                        ▼
                      </div>
                    </div>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div className={styles.roomCardBody}>
                        <div className={styles.roomBodyGrid}>
                          {/* Left: Photos */}
                          <div>
                            <div className={styles.photoSectionHeader}>
                              <span className={styles.photoSectionTitle}>Fotos ({photoCount})</span>
                              <div className={styles.photoSectionActions}>
                                <button
                                  className={styles.btnSecondary}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDropzoneTarget({
                                      type: 'experience',
                                      experienceId: exp.id,
                                    });
                                    setDropzoneOpen(true);
                                  }}
                                >
                                  + Upload
                                </button>
                              </div>
                            </div>

                            <div className={styles.dragHint}>
                              ↕️ Arraste as fotos para reordenar.
                            </div>

                            <div className={styles.photoGrid}>
                              {exp.gallery?.map((item, idx) => {
                                const media = item.image as MediaItem;
                                return (
                                  <div
                                    key={item.id || idx}
                                    className={styles.photoItem}
                                    draggable
                                    onDragStart={() => {
                                      dragItem.current = idx;
                                    }}
                                    onDragEnter={() => {
                                      dragOverItem.current = idx;
                                    }}
                                    onDragEnd={() => {
                                      if (
                                        dragItem.current !== null &&
                                        dragOverItem.current !== null &&
                                        dragItem.current !== dragOverItem.current
                                      ) {
                                        reorderExperienceGallery(
                                          exp.id,
                                          dragItem.current,
                                          dragOverItem.current
                                        );
                                      }
                                      dragItem.current = null;
                                      dragOverItem.current = null;
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                  >
                                    <img
                                      src={getMediaUrl(media, 'thumbnail')}
                                      alt={getMediaAlt(media)}
                                    />
                                    <div className={styles.photoItemOverlay}>
                                      <div />
                                      <div className={styles.photoItemActions}>
                                        <button
                                          className={`${styles.photoActionBtn} ${styles.photoActionDelete}`}
                                          title="Remover"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromExperienceGallery(exp.id, idx);
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                    <div className={styles.photoOrder}>{idx + 1}</div>
                                  </div>
                                );
                              })}

                              <div
                                className={styles.photoAdd}
                                onClick={() => {
                                  setDropzoneTarget({
                                    type: 'experience',
                                    experienceId: exp.id,
                                  });
                                  setDropzoneOpen(true);
                                }}
                              >
                                <span className={styles.photoAddPlus}>+</span>
                                <span>Adicionar fotos</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Info Panel */}
                          <div className={styles.infoPanel}>
                            <div className={styles.infoGroup}>
                              <label className={styles.infoLabel}>Descrição curta</label>
                              <textarea
                                className={styles.infoEditable}
                                rows={3}
                                value={
                                  (edits2.shortDescription as string) ?? exp.shortDescription ?? ''
                                }
                                onChange={(e) =>
                                  updateExperienceField(exp.id, 'shortDescription', e.target.value)
                                }
                              />
                            </div>

                            <div className={styles.infoGroup}>
                              <label className={styles.infoLabel}>Categoria</label>
                              <select
                                className={styles.infoEditable}
                                value={(edits2.category as string) ?? exp.category ?? ''}
                                onChange={(e) =>
                                  updateExperienceField(exp.id, 'category', e.target.value)
                                }
                              >
                                <option value="">Selecione...</option>
                                <option value="gastronomy">Gastronomia</option>
                                <option value="leisure">Lazer</option>
                                <option value="wellness">Bem-estar</option>
                                <option value="adventure">Aventura</option>
                                <option value="cultural">Cultural</option>
                              </select>
                            </div>

                            <div className={styles.infoGroup}>
                              <label className={styles.infoLabel}>Status</label>
                              <button
                                className={`${styles.statusToggle} ${
                                  exp.status === 'published'
                                    ? styles.statusTogglePublished
                                    : styles.statusToggleDraft
                                }`}
                                onClick={() => toggleExperienceStatus(exp.id)}
                              >
                                <span className={styles.statusToggleDot} />
                                {exp.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </button>
                            </div>

                            <div className={styles.roomCardFooter}>
                              <div className={styles.saveIndicator}>
                                {saving === exp.id ? (
                                  <>
                                    <span className={styles.dotSaving} /> Salvando...
                                  </>
                                ) : savedId === exp.id ? (
                                  <>
                                    <span className={styles.dotSaved} /> Salvo
                                  </>
                                ) : (
                                  <>
                                    <span className={styles.dotIdle} /> Pronto
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ SETTINGS SECTION ═══ */}
          {activeSection === 'settings' && (
            <div className={styles.settingsGrid}>
              {/* Hotel Info */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardTitle}>🏨 Informações do Hotel</div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Nome do Hotel</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('hotelName')}
                    onChange={(e) => updateSettingsField('hotelName', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Tagline</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('tagline')}
                    onChange={(e) => updateSettingsField('tagline', e.target.value)}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardTitle}>📞 Contato</div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Telefone</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('contact.phone')}
                    onChange={(e) => updateSettingsField('contact.phone', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>E-mail</label>
                  <input
                    className={styles.infoEditable}
                    type="email"
                    value={getSettingsValue('contact.email')}
                    onChange={(e) => updateSettingsField('contact.email', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>WhatsApp</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('contact.whatsapp')}
                    onChange={(e) => updateSettingsField('contact.whatsapp', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Endereço</label>
                  <textarea
                    className={styles.infoEditable}
                    rows={3}
                    value={getSettingsValue('contact.address')}
                    onChange={(e) => updateSettingsField('contact.address', e.target.value)}
                  />
                </div>
              </div>

              {/* Social */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardTitle}>🌐 Redes Sociais</div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Instagram</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('social.instagram')}
                    onChange={(e) => updateSettingsField('social.instagram', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Facebook</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('social.facebook')}
                    onChange={(e) => updateSettingsField('social.facebook', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>TripAdvisor</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('social.tripadvisor')}
                    onChange={(e) => updateSettingsField('social.tripadvisor', e.target.value)}
                  />
                </div>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Booking</label>
                  <input
                    className={styles.infoEditable}
                    type="text"
                    value={getSettingsValue('social.booking')}
                    onChange={(e) => updateSettingsField('social.booking', e.target.value)}
                  />
                </div>
              </div>

              {/* Hours */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardTitle}>🕐 Horários</div>
                <div className={styles.infoRow}>
                  <div className={styles.infoGroup}>
                    <label className={styles.infoLabel}>Check-in</label>
                    <input
                      className={styles.infoEditable}
                      type="text"
                      value={getSettingsValue('policies.checkinTime')}
                      onChange={(e) => updateSettingsField('policies.checkinTime', e.target.value)}
                    />
                  </div>
                  <div className={styles.infoGroup}>
                    <label className={styles.infoLabel}>Check-out</label>
                    <input
                      className={styles.infoEditable}
                      type="text"
                      value={getSettingsValue('policies.checkoutTime')}
                      onChange={(e) => updateSettingsField('policies.checkoutTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Logo/Favicon */}
              <div className={styles.settingsCard}>
                <div className={styles.settingsCardTitle}>🖼️ Logo e Favicon</div>
                <div className={styles.settingsMediaRow}>
                  <div className={styles.settingsMediaItem}>
                    <div className={styles.infoLabel}>Logo</div>
                    {settings.logo && typeof settings.logo !== 'number' ? (
                      <img
                        className={styles.settingsMediaPreview}
                        src={getMediaUrl(settings.logo, 'thumbnail')}
                        alt="Logo"
                      />
                    ) : (
                      <div className={styles.settingsMediaEmpty}>Sem logo</div>
                    )}
                  </div>
                  <div className={styles.settingsMediaItem}>
                    <div className={styles.infoLabel}>Favicon</div>
                    {settings.favicon && typeof settings.favicon !== 'number' ? (
                      <img
                        className={styles.settingsMediaPreviewSmall}
                        src={getMediaUrl(settings.favicon, 'thumbnail')}
                        alt="Favicon"
                      />
                    ) : (
                      <div className={styles.settingsMediaEmpty}>Sem favicon</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save indicator */}
              <div className={styles.settingsFooter}>
                <div className={styles.saveIndicator}>
                  {savingGlobal ? (
                    <>
                      <span className={styles.dotSaving} /> Salvando...
                    </>
                  ) : savedGlobal ? (
                    <>
                      <span className={styles.dotSaved} /> Salvo
                    </>
                  ) : (
                    <>
                      <span className={styles.dotIdle} /> Pronto
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ MEDIA SECTION ═══ */}
          {activeSection === 'media' && (
            <div>
              <div className={styles.mediaSectionHeader}>
                <span className={styles.photoSectionTitle}>
                  Biblioteca de Mídias ({mediaItems.length})
                </span>
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    setDropzoneTarget({ type: 'media' });
                    setDropzoneOpen(true);
                  }}
                >
                  + Upload
                </button>
              </div>

              {!mediaLoaded && (
                <div className={styles.emptyState}>
                  <p>Carregando mídias...</p>
                </div>
              )}

              {mediaLoaded && mediaItems.length === 0 && (
                <div className={styles.emptyState}>
                  <span className={styles.emptyStateIcon}>📁</span>
                  <p>Nenhuma mídia encontrada.</p>
                </div>
              )}

              <div className={styles.mediaGrid}>
                {mediaItems.map((item) => {
                  const isEditingAlt = editingMediaAlt === item.id;
                  return (
                    <div key={item.id} className={styles.mediaCard}>
                      <div className={styles.mediaCardImage}>
                        <img
                          src={getMediaUrl(item, 'thumbnail')}
                          alt={item.alt || item.filename || ''}
                        />
                        <div className={styles.mediaCardOverlay}>
                          <button
                            className={`${styles.photoActionBtn} ${styles.photoActionDelete}`}
                            title="Excluir"
                            onClick={() => deleteMediaItem(item.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className={styles.mediaCardInfo}>
                        <div className={styles.mediaCardFilename}>
                          {item.filename || `media-${item.id}`}
                        </div>
                        <div className={styles.mediaCardMeta}>
                          {item.width && item.height && (
                            <span>
                              {item.width}×{item.height}
                            </span>
                          )}
                          {item.filesize && <span>{formatBytes(item.filesize)}</span>}
                        </div>
                        {isEditingAlt ? (
                          <div className={styles.mediaAltEdit}>
                            <input
                              className={styles.mediaAltInput}
                              type="text"
                              value={mediaAltDraft}
                              onChange={(e) => setMediaAltDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveMediaAlt(item.id, mediaAltDraft);
                                }
                                if (e.key === 'Escape') {
                                  setEditingMediaAlt(null);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              className={styles.btnSecondary}
                              onClick={() => saveMediaAlt(item.id, mediaAltDraft)}
                            >
                              Salvar
                            </button>
                          </div>
                        ) : (
                          <div
                            className={styles.mediaAltText}
                            onClick={() => {
                              setEditingMediaAlt(item.id);
                              setMediaAltDraft(item.alt || '');
                            }}
                            title="Clique para editar texto alternativo"
                          >
                            {item.alt ? (
                              <span>Alt: {item.alt}</span>
                            ) : (
                              <span className={styles.mediaAltEmpty}>+ Adicionar alt text</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ DROPZONE OVERLAY ═══ */}
      {dropzoneOpen && (
        <div className={styles.dropzoneOverlay} onClick={() => setDropzoneOpen(false)}>
          <div
            className={styles.dropzoneBox}
            onClick={(e) => e.stopPropagation()}
            onDragOver={(e) => {
              e.preventDefault();
              if (styles.dropzoneBoxActive) e.currentTarget.classList.add(styles.dropzoneBoxActive);
            }}
            onDragLeave={(e) => {
              if (styles.dropzoneBoxActive)
                e.currentTarget.classList.remove(styles.dropzoneBoxActive);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (styles.dropzoneBoxActive)
                e.currentTarget.classList.remove(styles.dropzoneBoxActive);
              if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
            }}
          >
            <button className={styles.dropzoneClose} onClick={() => setDropzoneOpen(false)}>
              ✕
            </button>
            <div className={styles.dropzoneIcon}>📸</div>
            <div className={styles.dropzoneTitle}>Arraste suas fotos aqui</div>
            <div className={styles.dropzoneSubtitle}>
              Solte até 20 fotos de uma vez. Elas serão adicionadas ao final da galeria.
            </div>
            <label className={styles.dropzoneBrowse}>
              Escolher arquivos
              <input
                type="file"
                multiple
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => {
                  if (e.target.files?.length) handleUpload(e.target.files);
                }}
              />
            </label>
            <div className={styles.dropzoneFormats}>
              JPG, PNG, WebP — max 10MB por arquivo — min 1200px de largura
            </div>
          </div>
        </div>
      )}

      {/* ═══ UPLOAD PROGRESS PANEL ═══ */}
      {showUploadPanel && uploads.length > 0 && (
        <div className={styles.uploadPanel}>
          <div className={styles.uploadPanelHeader}>
            <span className={styles.uploadPanelTitle}>
              Upload — {uploads.length} arquivo{uploads.length > 1 ? 's' : ''}
            </span>
            <button
              className={styles.btnGhost}
              onClick={() => {
                setShowUploadPanel(false);
                setUploads([]);
              }}
            >
              ✕
            </button>
          </div>
          <div className={styles.uploadList}>
            {uploads.map((u, i) => (
              <div key={i} className={styles.uploadFile}>
                {u.thumbUrl ? (
                  <img className={styles.uploadFileThumb} src={u.thumbUrl} alt="" />
                ) : (
                  <div className={styles.uploadFileThumbPlaceholder}>📷</div>
                )}
                <div className={styles.uploadFileInfo}>
                  <div className={styles.uploadFileName}>{u.file.name}</div>
                  <div className={styles.uploadFileMeta}>
                    <span>{formatBytes(u.originalSize)}</span>
                    {u.processedSize && (
                      <>
                        <span>→ {formatBytes(u.processedSize)}</span>
                        <span
                          className={`${styles.compressionBadge} ${
                            1 - u.processedSize / u.originalSize > 0.85
                              ? styles.compressionGreat
                              : 1 - u.processedSize / u.originalSize > 0.7
                                ? styles.compressionGood
                                : styles.compressionWarn
                          }`}
                        >
                          ↓ {Math.round((1 - u.processedSize / u.originalSize) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  {u.lowRes && (
                    <div className={styles.resolutionWarning}>
                      ⚠️ Resolução baixa — pode ficar pixelada no hero
                    </div>
                  )}
                  <div className={styles.uploadBar}>
                    <div
                      className={`${styles.uploadBarFill} ${u.status === 'done' ? styles.uploadBarDone : ''}`}
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                </div>
                <div className={styles.uploadFileStatus}>
                  {u.status === 'done' ? '✅' : u.status === 'error' ? '❌' : `${u.progress}%`}
                </div>
              </div>
            ))}
          </div>
          {uploads.every((u) => u.status !== 'uploading') && (
            <div className={styles.uploadSummary}>
              <span>
                Total: {formatBytes(uploads.reduce((a, u) => a + u.originalSize, 0))}
                {uploads.some((u) => u.processedSize) && (
                  <>
                    {' '}
                    →{' '}
                    <strong>
                      {formatBytes(
                        uploads
                          .filter((u) => u.processedSize)
                          .reduce((a, u) => a + (u.processedSize || 0), 0)
                      )}
                    </strong>
                  </>
                )}
              </span>
              <span className={styles.uploadSummaryPercent}>
                {uploads.filter((u) => u.status === 'done').length}/{uploads.length} concluídos
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Gallery Category Section (sub-component)
   ═══════════════════════════════════════════════════════ */
function GalleryCategorySection({
  title,
  items,
  category,
  onReorder,
  onUpload,
  onDelete,
  editingTitleId,
  titleDraft,
  onStartEditTitle,
  onChangeTitleDraft,
  onSaveTitle,
  onCancelEditTitle,
}: {
  title: string;
  items: GalleryItem[];
  category: string;
  onReorder: (category: string, from: number, to: number) => void;
  onUpload: () => void;
  onDelete: (id: number) => void;
  editingTitleId: number | null;
  titleDraft: string;
  onStartEditTitle: (id: number, title: string) => void;
  onChangeTitleDraft: (val: string) => void;
  onSaveTitle: (id: number, title: string) => void;
  onCancelEditTitle: () => void;
}) {
  const dragRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  return (
    <div className={styles.categorySection}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryTitle}>
          {title}
          <span className={styles.categoryCount}>{items.length} fotos</span>
        </div>
        <button className={styles.btnSecondary} onClick={onUpload}>
          + Upload
        </button>
      </div>
      <div className={styles.galleryGrid}>
        {items.map((item, idx) => {
          const media = item.image as MediaItem;
          const isEditingTitle = editingTitleId === item.id;
          return (
            <div
              key={item.id}
              className={styles.galleryItem}
              draggable
              onDragStart={() => {
                dragRef.current = idx;
              }}
              onDragEnter={() => {
                dragOverRef.current = idx;
              }}
              onDragEnd={() => {
                if (
                  dragRef.current !== null &&
                  dragOverRef.current !== null &&
                  dragRef.current !== dragOverRef.current
                ) {
                  onReorder(category, dragRef.current, dragOverRef.current);
                }
                dragRef.current = null;
                dragOverRef.current = null;
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <img src={getMediaUrl(media, 'thumbnail')} alt={getMediaAlt(media)} />
              <div className={styles.galleryDragHandle}>⠿</div>
              <div className={styles.galleryItemOverlay}>
                {isEditingTitle ? (
                  <input
                    className={styles.galleryTitleInput}
                    type="text"
                    value={titleDraft}
                    onChange={(e) => onChangeTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveTitle(item.id, titleDraft);
                      }
                      if (e.key === 'Escape') {
                        onCancelEditTitle();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div
                    className={styles.galleryItemTitle}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEditTitle(item.id, item.title);
                    }}
                    title="Clique para editar título"
                  >
                    {item.title}
                  </div>
                )}
                <button
                  className={`${styles.galleryDeleteBtn}`}
                  title="Excluir"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
        <div className={styles.galleryAdd} onClick={onUpload}>
          <span className={styles.galleryAddPlus}>+</span>
          <span>Adicionar fotos</span>
        </div>
      </div>
    </div>
  );
}
