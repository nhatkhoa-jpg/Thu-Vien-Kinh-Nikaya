'use client';
import {useMemo} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ChevronLeft,ChevronRight,Home,Library} from 'lucide-react';
import {suttas,suttaDisplayCode} from '@/lib/data';
import type {Locale} from '@/lib/i18n';
import {publicUi} from '@/lib/public-ui';

const navCopy:Partial<Record<Locale,{navigation:string;previous:string;prev:string;jump:string;next:string}>>={
  vi:{navigation:'Điều hướng bài kinh',previous:'Bài trước',prev:'Trước',jump:'Nhảy nhanh',next:'Sau'},
  en:{navigation:'Reader navigation',previous:'Previous discourse',prev:'Prev',jump:'Jump',next:'Next'},
  zh:{navigation:'经文导航',previous:'上一篇',prev:'上一篇',jump:'快速跳转',next:'下一篇'},
  th:{navigation:'นำทางพระสูตร',previous:'พระสูตรก่อนหน้า',prev:'ก่อนหน้า',jump:'ข้ามไป',next:'ถัดไป'},
  my:{navigation:'သုတ်တော် လမ်းညွှန်',previous:'ယခင်သုတ်',prev:'ယခင်',jump:'အမြန်ရွေး',next:'နောက်'},
  si:{navigation:'සූත්‍ර සංචාලනය',previous:'පෙර සූත්‍රය',prev:'පෙර',jump:'ඉක්මන් තේරීම',next:'ඊළඟ'},
  km:{navigation:'ការរុករកព្រះសូត្រ',previous:'ព្រះសូត្រមុន',prev:'មុន',jump:'លោតរហ័ស',next:'បន្ទាប់'},
  lo:{navigation:'ນຳທາງພຣະສູດ',previous:'ພຣະສູດກ່ອນ',prev:'ກ່ອນ',jump:'ໄປດ່ວນ',next:'ຕໍ່ໄປ'}
};

export default function ReaderQuickJump({locale,currentSlug}:{locale:Locale;currentSlug:string}){
  const vi=locale==='vi';const router=useRouter();const u=publicUi(locale);const c=navCopy[locale]||navCopy.en!;
  const current=suttas.find(s=>s.slug===currentSlug)!;
  const same=useMemo(()=>suttas.filter(s=>s.collection===current.collection),[current.collection]);
  const idx=same.findIndex(s=>s.slug===currentSlug);const prev=idx>0?same[idx-1]:null;const next=idx>=0&&idx<same.length-1?same[idx+1]:null;
  return <nav className="readerQuickJump" aria-label={c.navigation}>
    <Link className="rqHome" href={`/${locale}`}><Home size={18}/><span>{u.home}</span></Link>
    <Link className="rqLibrary" href={`/${locale}#library`}><Library size={18}/><span>{u.backLibrary}</span></Link>
    <button disabled={!prev} onClick={()=>prev&&router.push(`/${locale}/library/${prev.slug}`)} aria-label={c.previous}><ChevronLeft size={19}/><span>{c.prev}</span></button>
    <label className="rqSelect"><span>{c.jump}</span><select value={currentSlug} onChange={e=>router.push(`/${locale}/library/${e.target.value}`)}>{same.map(s=><option value={s.slug} key={s.slug}>{suttaDisplayCode(s,vi)} · {vi?s.vi:s.en}</option>)}</select></label>
    <button disabled={!next} onClick={()=>next&&router.push(`/${locale}/library/${next.slug}`)} aria-label={c.next}><span>{c.next}</span><ChevronRight size={19}/></button>
  </nav>;
}
