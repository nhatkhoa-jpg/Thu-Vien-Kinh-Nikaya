import type {MetadataRoute} from 'next';
import {locales,scriptureLocales} from '@/lib/i18n';
import {suttas} from '@/lib/data';
import {SITE_URL} from '@/lib/site';

const infoPages=['about','privacy','terms','editorial-policy','tam-tang'] as const;

export default function sitemap():MetadataRoute.Sitemap{
  return [
    ...locales.map(l=>({url:`${SITE_URL}/${l}`,changeFrequency:'weekly' as const,priority:1})),
    ...locales.flatMap(l=>infoPages.map(page=>({url:`${SITE_URL}/${l}/${page}`,changeFrequency:page==='tam-tang'?'weekly' as const:'monthly' as const,priority:page==='tam-tang'?.72:.45}))),
    ...scriptureLocales.flatMap(l=>suttas.map(s=>({url:`${SITE_URL}/${l}/library/${s.slug}`,changeFrequency:'monthly' as const,priority:.8})))
  ];
}
