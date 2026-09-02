'use client';
import {usePathname, useRouter} from 'next/navigation';
import {deferredLocales,languageNames,locales,type Locale} from '@/lib/i18n';
const allLocales=[...locales,...deferredLocales] as const;
export default function LanguageSelect({locale}:{locale:Locale}){
 const router=useRouter(); const pathname=usePathname();
 function change(next:string){ const parts=pathname.split('/'); parts[1]=next; router.push(parts.join('/')||`/${next}`); }
 const selected=allLocales.includes(locale as typeof allLocales[number])?locale:'en';
 return <select className="lang" aria-label="Language" value={selected} onChange={e=>change(e.target.value)}>{allLocales.map(l=><option key={l} value={l}>{languageNames[l]}</option>)}</select>;
}
