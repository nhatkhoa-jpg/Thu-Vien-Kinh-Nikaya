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
  },
  webpack(config,{isServer}){
    if(!isServer){
      config.resolve.fallback={
        ...(config.resolve.fallback||{}),
        fs:false,
        path:false,
        os:false,
        worker_threads:false
      };
    }
    return config;
  }
};

export default nextConfig;
