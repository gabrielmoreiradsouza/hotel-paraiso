import type { CollectionConfig } from 'payload';

const ARTAX_CATEGORIES_BY_SLUG: Record<string, Array<{ categoryId: number }>> = {
  confort: [{ categoryId: 3573 }, { categoryId: 6704 }, { categoryId: 3572 }],
  standard: [{ categoryId: 3577 }, { categoryId: 3578 }],
  luxo: [{ categoryId: 3574 }, { categoryId: 6663 }],
  master: [{ categoryId: 3580 }, { categoryId: 3581 }],
  'suite-master': [{ categoryId: 3580 }, { categoryId: 3581 }],
};

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'Quarto', plural: 'Quartos' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'status', 'startingPrice'] },
  access: { read: () => true },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.['artaxCategoryIds']?.length && typeof data?.['slug'] === 'string') {
          const mappedCategories = ARTAX_CATEGORIES_BY_SLUG[data['slug']];
          if (mappedCategories) data['artaxCategoryIds'] = mappedCategories;
        }
        return data;
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (!doc['artaxCategoryIds']?.length && typeof doc['slug'] === 'string') {
          doc['artaxCategoryIds'] = ARTAX_CATEGORIES_BY_SLUG[doc['slug']] ?? [];
        }
        return doc;
      },
    ],
  },

  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    {
      name: 'artaxRoomTypeId',
      type: 'number',
      admin: {
        description:
          'Legado: mantido temporariamente para migração segura. Use as categorias abaixo.',
        hidden: true,
        position: 'sidebar',
      },
    },
    {
      name: 'artaxCategoryIds',
      type: 'array',
      admin: {
        description: 'Categorias (room_type_id) da Artax PMS vinculadas a este quarto.',
        position: 'sidebar',
      },
      fields: [
        {
          name: 'categoryId',
          type: 'number',
          required: true,
          admin: { description: 'ID real da categoria no Artax PMS' },
        },
      ],
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
