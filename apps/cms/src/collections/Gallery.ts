import type { CollectionConfig } from 'payload';

export const Gallery: CollectionConfig = {
  slug: 'gallery',
  labels: { singular: 'Item da Galeria', plural: 'Galeria' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'order'] },
  access: { read: () => true },

  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Quartos', value: 'rooms' },
        { label: 'Áreas comuns', value: 'common' },
        { label: 'Restaurante & Eventos', value: 'restaurant' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
};
