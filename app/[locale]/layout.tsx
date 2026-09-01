import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Header from '@/components/Header';
import {dict,isLocale,languageNames,locales,type Locale} from '@/lib/i18n';

const baseUrl=process.env.NEXT_PUBLIC_SITE_URL || 'https://thu-vien-kinh-nikaya-khoa-3f1b.vercel.app';

export function generateStaticParams(){return locales.map(locale=>({locale}))}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale:raw}=await params;
  if(!isLocale(raw)) return {};
  const locale=raw as Locale;
  const d=dict(locale);
  return {
    title:d.brand,
    description:d.heroLead,
    alternates:{
      canonical:`${baseUrl}/${locale}`,
      languages:Object.fromEntries(locales.map(l=>[l,`${baseUrl}/${l}`]))
    },
    openGraph:{title:d.brand,description:d.heroLead,url:`${baseUrl}/${locale}`,type:'website',locale},
    other:{'content-language':locale}
  };
}

export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  if(!isLocale(raw))notFound();
  const locale=raw as Locale;
  const rtl=locale==='ar'||locale==='ur';
  return <div lang={locale} dir={rtl?'rtl':'ltr'} data-language={languageNames[locale]}><Header locale={locale}/>{children}</div>;
}
