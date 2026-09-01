import type {MetadataRoute} from 'next';
import {locales} from '@/lib/i18n';
import {suttas} from '@/lib/data';
const base='https://thu-vien-kinh-nikaya.vercel.app';
export default function sitemap():MetadataRoute.Sitemap{return [...locales.map(l=>({url:`${base}/${l}`,changeFrequency:'weekly' as const,priority:1})),...locales.flatMap(l=>suttas.map(s=>({url:`${base}/${l}/library/${s.slug}`,changeFrequency:'monthly' as const,priority:.8})))];}
