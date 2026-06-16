import type { GlobalConfig } from 'payload';

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Configurações',
  access: { read: () => true },

  fields: [
    {
      name: 'hotelName',
      type: 'text',
      required: true,
      defaultValue: 'Hotel Paraíso',
      localized: true,
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'whatsapp', type: 'text' },
        { name: 'address', type: 'textarea', localized: true },
      ],
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'facebook', type: 'text' },
        { name: 'tripadvisor', type: 'text' },
        { name: 'booking', type: 'text' },
      ],
    },
    {
      name: 'policies',
      type: 'group',
      fields: [
        { name: 'checkinTime', type: 'text', defaultValue: '14:00' },
        { name: 'checkoutTime', type: 'text', defaultValue: '12:00' },
        { name: 'cancellationPolicy', type: 'richText', localized: true },
        { name: 'privacyPolicy', type: 'richText', localized: true },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
