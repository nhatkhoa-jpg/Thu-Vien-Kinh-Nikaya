import type { NextConfig } from 'next';

const standardNextBuild = process.env.npm_lifecycle_event === 'build';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(standardNextBuild ? {
    turbopack: {
      resolveAlias: {
        'cloudflare:workers': './lib/cloudflare-workers-stub.ts'
      }
    }
  } : {})
};

export default nextConfig;
