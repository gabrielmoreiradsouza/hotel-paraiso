import type { CollectionConfig } from 'payload';

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'Quarto', plural: 'Quartos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'artaxRoomTypeId', 'status'] },
  access: { read: () => true },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'artaxRoomTypeId',
      type: 'number',
      required: true,
      unique: true,
      admin: {
        description: 'room_type_id correspondente na Artax PMS',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Rascunho', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'amenities',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'icon',
          type: 'text',
          admin: { description: 'Nome do ícone (ex: wifi, tv, ac)' },
        },
      ],
    },
    {
      name: 'capacity',
      type: 'group',
      fields: [
        { name: 'adults', type: 'number', defaultValue: 2 },
        { name: 'children', type: 'number', defaultValue: 1 },
      ],
    },
    {
      name: 'size',
      type: 'number',
      admin: { description: 'Tamanho em m²' },
    },
    {
      name: 'seo',
      type: 'group',
      localized: true,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
};
