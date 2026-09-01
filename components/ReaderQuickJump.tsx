'use client';
import {useMemo} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ChevronLeft,ChevronRight,Home,Library} from 'lucide-react';
import {suttas,suttaDisplayCode} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

export default function ReaderQuickJump({locale,currentSlug}:{locale:Locale;currentSlug:string}){
  const vi=locale==='vi';const router=useRouter();
  const current=suttas.find(s=>s.slug===currentSlug)!;
  const same=useMemo(()=>suttas.filter(s=>s.collection===current.collection),[current.collection]);
  const idx=same.findIndex(s=>s.slug===currentSlug);const prev=idx>0?same[idx-1]:null;const next=idx>=0&&idx<same.length-1?same[idx+1]:null;
  return <nav className="readerQuickJump" aria-label={vi?'Điều hướng bài kinh':'Reader navigation'}>
    <Link className="rqHome" href={`/${locale}`}><Home size={17}/><span>{vi?'Trang chủ':'Home'}</span></Link>
    <Link className="rqLibrary" href={`/${locale}#library`}><Library size={17}/><span>{vi?'Thư viện':'Library'}</span></Link>
    <button disabled={!prev} onClick={()=>prev&&router.push(`/${locale}/library/${prev.slug}`)} aria-label={vi?'Bài trước':'Previous'}><ChevronLeft size={18}/><span>{vi?'Trước':'Prev'}</span></button>
    <label className="rqSelect"><span>{vi?'Nhảy nhanh':'Jump'}</span><select value={currentSlug} onChange={e=>router.push(`/${locale}/library/${e.target.value}`)}>{same.map(s=><option value={s.slug} key={s.slug}>{suttaDisplayCode(s,vi)} · {vi?s.vi:s.en}</option>)}</select></label>
    <button disabled={!next} onClick={()=>next&&router.push(`/${locale}/library/${next.slug}`)} aria-label={vi?'Bài sau':'Next'}><span>{vi?'Sau':'Next'}</span><ChevronRight size={18}/></button>
  </nav>;
}
