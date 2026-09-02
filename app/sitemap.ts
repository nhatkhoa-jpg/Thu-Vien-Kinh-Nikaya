import type {MetadataRoute} from 'next';
import {locales,scriptureLocales} from '@/lib/i18n';
import {suttas} from '@/lib/data';
import {SITE_URL} from '@/lib/site';

export default function sitemap():MetadataRoute.Sitemap{
  return [
    ...locales.map(l=>({url:`${SITE_URL}/${l}`,changeFrequency:'weekly' as const,priority:1})),
    ...scriptureLocales.flatMap(l=>suttas.map(s=>({url:`${SITE_URL}/${l}/library/${s.slug}`,changeFrequency:'monthly' as const,priority:.8})))
  ];
}
