'use client';
import {useMemo} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ChevronLeft,ChevronRight,Home,Library} from 'lucide-react';
import {suttas,suttaDisplayCode} from '@/lib/data';
import type {Locale} from '@/lib/i18n';
import {publicUi} from '@/lib/public-ui';

const navLabels:Record<string,{nav:string;prev:string;next:string;jump:string}>={
  vi:{nav:'Điều hướng bài kinh',prev:'Trước',next:'Sau',jump:'Nhảy nhanh'},
  en:{nav:'Reader navigation',prev:'Prev',next:'Next',jump:'Jump'},
  th:{nav:'การนำทางพระสูตร',prev:'ก่อนหน้า',next:'ถัดไป',jump:'ไปยัง'},
  my:{nav:'သုတ်တော် လမ်းညွှန်',prev:'ယခင်',next:'နောက်',jump:'အမြန်သွား'},
  si:{nav:'සුත්ත සංචාලනය',prev:'පෙර',next:'ඊළඟ',jump:'යන්න'},
  km:{nav:'ការរុករកសូត្រ',prev:'មុន',next:'បន្ទាប់',jump:'ទៅកាន់'},
  lo:{nav:'ການນຳທາງພຣະສູດ',prev:'ກ່ອນໜ້າ',next:'ຕໍ່ໄປ',jump:'ໄປຫາ'},
  zh:{nav:'经文导航',prev:'上一篇',next:'下一篇',jump:'快速跳转'}
};

export default function ReaderQuickJump({locale,currentSlug}:{locale:Locale;currentSlug:string}){
  const vi=locale==='vi';const u=publicUi(locale);const labels=navLabels[locale]||navLabels.en;const router=useRouter();
  const current=suttas.find(s=>s.slug===currentSlug)!;
  const same=useMemo(()=>suttas.filter(s=>s.collection===current.collection),[current.collection]);
  const idx=same.findIndex(s=>s.slug===currentSlug);const prev=idx>0?same[idx-1]:null;const next=idx>=0&&idx<same.length-1?same[idx+1]:null;
  const title=(s:(typeof suttas)[number])=>vi?s.vi:locale==='en'?s.en:s.pali||s.en;
  return <nav className="readerQuickJump" aria-label={labels.nav}>
    <Link className="rqHome" href={`/${locale}`}><Home size={17}/><span>{u.home}</span></Link>
    <Link className="rqLibrary" href={`/${locale}#library`}><Library size={17}/><span>{u.libraryInfo}</span></Link>
    <button disabled={!prev} onClick={()=>prev&&router.push(`/${locale}/library/${prev.slug}`)} aria-label={labels.prev}><ChevronLeft size={18}/><span>{labels.prev}</span></button>
    <label className="rqSelect"><span>{labels.jump}</span><select value={currentSlug} onChange={e=>router.push(`/${locale}/library/${e.target.value}`)}>{same.map(s=><option value={s.slug} key={s.slug}>{suttaDisplayCode(s,vi)} · {title(s)}</option>)}</select></label>
    <button disabled={!next} onClick={()=>next&&router.push(`/${locale}/library/${next.slug}`)} aria-label={labels.next}><span>{labels.next}</span><ChevronRight size={18}/></button>
  </nav>;
}
