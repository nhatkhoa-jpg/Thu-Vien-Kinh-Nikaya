import type {MetadataRoute} from 'next';

const base=process.env.NEXT_PUBLIC_SITE_URL || 'https://thu-vien-kinh-nikaya-khoa-3f1b.vercel.app';

export default function robots():MetadataRoute.Robots{
  return {rules:{userAgent:'*',allow:'/'},sitemap:`${base}/sitemap.xml`};
}
