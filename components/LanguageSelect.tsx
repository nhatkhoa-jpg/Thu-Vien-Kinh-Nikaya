'use client';
import {usePathname, useRouter} from 'next/navigation';
import {languageNames, locales, type Locale} from '@/lib/i18n';
export default function LanguageSelect({locale}:{locale:Locale}){
 const router=useRouter(); const pathname=usePathname();
 function change(next:string){ const parts=pathname.split('/'); parts[1]=next; router.push(parts.join('/')||`/${next}`); }
 return <select className="lang" aria-label="Language" value={locale} onChange={e=>change(e.target.value)}>{locales.map(l=><option key={l} value={l}>{languageNames[l]}</option>)}</select>;
}
