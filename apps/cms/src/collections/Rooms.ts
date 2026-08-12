import type { CollectionConfig } from 'payload';

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'Quarto', plural: 'Quartos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'startingPrice'] },
  access: { read: () => true },

  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    {
      name: 'artaxRoomTypeId',
      type: 'number',
      unique: true,
      admin: { description: 'room_type_id na Artax PMS (opcional)', position: 'sidebar' },
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
      name: 'startingPrice',
      type: 'text',
      localized: true,
      admin: { description: 'Preço de exibição (ex: "A partir de R$ 130")' },
    },
    { name: 'shortDescription', type: 'textarea', localized: true },
    {
      name: 'longDescription',
      type: 'textarea',
      localized: true,
      admin: { description: 'Descrição completa na página do quarto' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      admin: { description: 'Descrição rica (opcional, uso futuro)' },
    },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'amenities',
      type: 'array',
      localized: true,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'icon', type: 'text', admin: { description: 'Nome do ícone (ex: wifi, tv, ac)' } },
      ],
    },
    {
      name: 'capacityLabel',
      type: 'text',
      localized: true,
      admin: { description: 'Ex: "1–2 adultos"' },
    },
    {
      name: 'capacity',
      type: 'group',
      fields: [
        { name: 'adults', type: 'number', defaultValue: 2 },
        { name: 'children', type: 'number', defaultValue: 1 },
      ],
    },
    { name: 'size', type: 'number', admin: { description: 'Tamanho em m²' } },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Ordem de exibição' },
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
