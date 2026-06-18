import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root: '../..',
  },
};

export default nextConfig;
// trigger rebuild 1781790934
