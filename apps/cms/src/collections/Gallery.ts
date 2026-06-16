import type { CollectionConfig } from 'payload';

export const Gallery: CollectionConfig = {
  slug: 'gallery',
  labels: { singular: 'Item da Galeria', plural: 'Galeria' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'order'] },
  access: { read: () => true },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Quartos', value: 'rooms' },
        { label: 'Áreas comuns', value: 'common-areas' },
        { label: 'Gastronomia', value: 'gastronomy' },
        { label: 'Piscina & Lazer', value: 'pool-leisure' },
        { label: 'Paisagens', value: 'landscapes' },
        { label: 'Eventos', value: 'events' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
};
