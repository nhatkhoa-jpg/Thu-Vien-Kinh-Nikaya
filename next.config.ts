import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['text2wav'],
  outputFileTracingIncludes: {
    '/api/tts': [
      './node_modules/text2wav/lib/**/*',
      './node_modules/text2wav/espeak-ng-data/**/*'
    ]
  }
};

export default nextConfig;
