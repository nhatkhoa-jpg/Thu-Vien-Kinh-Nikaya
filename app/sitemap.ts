import type {MetadataRoute} from 'next';
import {locales} from '@/lib/i18n';
import {suttas} from '@/lib/data';

const base=process.env.NEXT_PUBLIC_SITE_URL || 'https://thu-vien-kinh-nikaya-khoa-3f1b.vercel.app';

export default function sitemap():MetadataRoute.Sitemap{
  return [
    ...locales.map(l=>({url:`${base}/${l}`,changeFrequency:'weekly' as const,priority:1})),
    ...locales.flatMap(l=>suttas.map(s=>({url:`${base}/${l}/library/${s.slug}`,changeFrequency:'monthly' as const,priority:.8})))
  ];
}
