import type {NextConfig} from 'next';

const isGitHubPages=process.env.GITHUB_ACTIONS==='true';
const repoBase='/Thu-Vien-Kinh-Nikaya';

const nextConfig:NextConfig={
  poweredByHeader:false,
  reactStrictMode:true,
  output:'export',
  trailingSlash:true,
  basePath:isGitHubPages?repoBase:'',
  assetPrefix:isGitHubPages?`${repoBase}/`:undefined
};

export default nextConfig;
