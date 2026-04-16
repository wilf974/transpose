import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['openai', 'pdf-parse'],
};

export default nextConfig;
