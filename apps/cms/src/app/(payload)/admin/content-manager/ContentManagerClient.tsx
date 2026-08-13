'use client';

import { useState, useCallback, useRef } from 'react';
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
}

interface GalleryItem {
  id: number;
  title: string;
  category: 'rooms' | 'common' | 'restaurant';
  image: MediaItem | number;
  order: number;
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

interface Props {
  initialRooms: Room[];
  initialGallery: GalleryItem[];
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

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function ContentManagerClient({ initialRooms, initialGallery }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [activeTab, setActiveTab] = useState<'rooms' | 'gallery'>('rooms');
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [previewRoom, setPreviewRoom] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  // Upload state
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const [dropzoneTarget, setDropzoneTarget] = useState<
    { type: 'room'; roomId: number } | { type: 'gallery'; category: string } | null
  >(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Editing state
  const [editFields, setEditFields] = useState<Record<number, Partial<Room>>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
    },
    [dropzoneTarget, rooms, refreshRooms, refreshGallery]
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
              className={`${styles.sidebarLink} ${activeTab === 'rooms' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              🏨 Quartos
            </button>
            <button
              className={`${styles.sidebarLink} ${activeTab === 'gallery' ? styles.sidebarLinkActive : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              🖼️ Galeria
            </button>
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
              className={`${styles.tab} ${activeTab === 'rooms' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              Quartos <span className={styles.tabBadge}>{rooms.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'gallery' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              Galeria Geral <span className={styles.tabBadge}>{totalGallery}</span>
            </button>
          </div>

          {/* ═══ ROOMS TAB ═══ */}
          {activeTab === 'rooms' && (
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
                                <div style={{ display: 'flex', gap: '4px' }}>
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
                                      {edits.startingPrice ?? room.startingPrice}
                                    </div>
                                    <div className={styles.siteRoomDesc}>
                                      {edits.shortDescription ?? room.shortDescription}
                                    </div>
                                    <div className={styles.siteRoomDescFull}>
                                      {edits.longDescription ?? room.longDescription}
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
                              <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Descrição curta</label>
                                <textarea
                                  className={styles.infoEditable}
                                  rows={2}
                                  value={edits.shortDescription ?? room.shortDescription ?? ''}
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
                                  value={edits.longDescription ?? room.longDescription ?? ''}
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
                                  value={edits.startingPrice ?? room.startingPrice ?? ''}
                                  onChange={(e) =>
                                    updateRoomField(room.id, 'startingPrice', e.target.value)
                                  }
                                  style={{ width: '220px' }}
                                />
                              </div>

                              <div className={styles.infoRow}>
                                <div className={styles.infoGroup}>
                                  <div className={styles.infoLabel}>Tamanho</div>
                                  <div className={styles.infoValue}>{room.size}m²</div>
                                </div>
                                <div className={styles.infoGroup}>
                                  <div className={styles.infoLabel}>Capacidade</div>
                                  <div className={styles.infoValue}>
                                    {room.capacityLabel || `${room.capacity?.adults || 2} adultos`}
                                  </div>
                                </div>
                              </div>

                              {room.amenities && room.amenities.length > 0 && (
                                <div className={styles.infoGroup}>
                                  <div className={styles.infoLabel}>Amenidades</div>
                                  <div className={styles.amenityList}>
                                    {room.amenities.map((a, i) => (
                                      <span key={i} className={styles.amenityTag}>
                                        {getAmenityIcon(a.icon, a.name)} {a.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

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

          {/* ═══ GALLERY TAB ═══ */}
          {activeTab === 'gallery' && (
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
                  <span className={styles.categoryHint}>Gerencie na aba "Quartos"</span>
                </div>
                <div className={styles.galleryGrid}>
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={styles.galleryItem}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setActiveTab('rooms');
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
                style={{ display: 'none' }}
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
}: {
  title: string;
  items: GalleryItem[];
  category: string;
  onReorder: (category: string, from: number, to: number) => void;
  onUpload: () => void;
}) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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
          return (
            <div
              key={item.id}
              className={styles.galleryItem}
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
                  onReorder(category, dragItem.current, dragOverItem.current);
                }
                dragItem.current = null;
                dragOverItem.current = null;
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <img src={getMediaUrl(media, 'thumbnail')} alt={getMediaAlt(media)} />
              <div className={styles.galleryDragHandle}>⠿</div>
              <div className={styles.galleryItemOverlay}>
                <div className={styles.galleryItemTitle}>{item.title}</div>
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
