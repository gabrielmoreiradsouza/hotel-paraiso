import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['pg', 'pg-native', 'sharp', '@payloadcms/db-postgres'],
  turbopack: {
    root: '../..',
  },
};

export default withPayload(nextConfig);
