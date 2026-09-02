import {notFound} from 'next/navigation';
import InfoPage,{infoMetadata} from '@/components/InfoPage';
import {isLocale,type Locale} from '@/lib/i18n';

export async function generateMetadata({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))return{};return infoMetadata('about',locale as Locale);}
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!isLocale(locale))notFound();return <InfoPage locale={locale as Locale} kind="about"/>;}
