import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import sharp from 'sharp';

import { Rooms } from './collections/Rooms';
import { Experiences } from './collections/Experiences';
import { Gallery } from './collections/Gallery';
import { Pages } from './collections/Pages';
import { BlogPosts } from './collections/BlogPosts';
import { Media } from './collections/Media';
import { Settings } from './collections/Settings';

export default buildConfig({
  admin: {
    meta: {
      titleSuffix: ' — Hotel Paraíso',
    },
  },

  collections: [Rooms, Experiences, Gallery, Pages, BlogPosts, Media],
  globals: [Settings],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString:
        process.env['CMS_DATABASE_URL'] ??
        process.env['DATABASE_URL'] ??
        'postgresql://hotel_paraiso:hotel_paraiso_dev@localhost:5432/hotel_paraiso',
    },
    schemaName: 'cms',
    push: true,
  }),

  localization: {
    locales: [
      { label: 'Português', code: 'pt' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'pt',
    fallback: true,
  },

  sharp,

  typescript: {
    outputFile: 'src/payload-types.ts',
  },

  secret: process.env['PAYLOAD_SECRET'] ?? 'hotel-paraiso-dev-secret-change-in-production',
});
