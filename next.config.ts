import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'cloudflare:workers': './lib/cloudflare-workers-stub.ts'
    }
  }
};

export default nextConfig;
