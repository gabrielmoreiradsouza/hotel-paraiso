import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://hotel_paraiso:hotel_paraiso_dev@localhost:5432/hotel_paraiso',
  },
});
