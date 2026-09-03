import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import {dict,isDeferredLocale,isLocale,languageNames,locales,type Locale} from '@/lib/i18n';
import {SITE_URL} from '@/lib/site';

export function generateStaticParams(){return locales.map(locale=>({locale}))}

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale:raw}=await params;
  if(!isLocale(raw)) return {};
  const locale=raw as Locale;
  const d=dict(locale);
  if(isDeferredLocale(locale))return {title:d.brand,description:d.heroLead,robots:{index:false,follow:true},alternates:{canonical:`${SITE_URL}/en`}};
  return {
    title:d.brand,
    description:d.heroLead,
    alternates:{
      canonical:`${SITE_URL}/${locale}`,
      languages:Object.fromEntries(locales.map(l=>[l,`${SITE_URL}/${l}`]))
    },
    openGraph:{title:d.brand,description:d.heroLead,url:`${SITE_URL}/${locale}`,type:'website',locale},
    other:{'content-language':locale}
  };
}

export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
  const {locale:raw}=await params;
  if(!isLocale(raw))notFound();
  const locale=raw as Locale;
  const rtl=locale==='ar'||locale==='ur';
  return <div lang={locale} dir={rtl?'rtl':'ltr'} data-language={languageNames[locale]}><Header locale={locale}/>{children}<SiteFooter locale={locale}/></div>;
}
