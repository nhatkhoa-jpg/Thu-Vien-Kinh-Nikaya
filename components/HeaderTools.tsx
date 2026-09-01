'use client';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {BookOpen,Headphones,Home,Library,Menu,Search,X} from 'lucide-react';
import {suttas,suttaDisplayCode} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

const RELEASE='V4.11.2-STAGE';

export default function HeaderTools({locale}:{locale:Locale}){
  const vi=locale==='vi';
  const router=useRouter();
  const [searchOpen,setSearchOpen]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [q,setQ]=useState('');
  const results=useMemo(()=>{
    const needle=q.trim().toLocaleLowerCase();
    if(!needle)return suttas.slice(0,8);
    return suttas.filter(s=>[s.code,s.viCode,s.vi,s.en,s.pali,...s.topics,s.summaryVi,s.summaryEn].join(' ').toLocaleLowerCase().includes(needle)).slice(0,10);
  },[q]);
  function go(slug:string){setSearchOpen(false);setMenuOpen(false);setQ('');router.push(`/${locale}/library/${slug}`);}
  return <>
    <span className="testVersionBadge" aria-label={`Test build ${RELEASE}`}>{RELEASE}</span>
    <button data-release={RELEASE} className="headerSearchTrigger" onClick={()=>setSearchOpen(true)} aria-label={vi?'Tìm kiếm toàn thư viện':'Search library'}><Search size={18}/><span>{vi?'Tìm kinh...':'Search...'}</span></button>
    <button className="mobileMenuButton" onClick={()=>setMenuOpen(true)} aria-label={vi?'Mở menu':'Open menu'}><Menu size={21}/></button>
    {searchOpen&&<div className="commandBackdrop" onMouseDown={()=>setSearchOpen(false)}><section className="commandPalette" onMouseDown={e=>e.stopPropagation()}>
      <div className="commandHead"><Search size={20}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={vi?'Tìm TB 21, tên kinh, Pāli, chủ đề...':'Search code, title, Pāli, topic...'}/><button onClick={()=>setSearchOpen(false)}><X size={20}/></button></div>
      <div className="commandHint">{vi?'Tìm trong toàn bộ thư viện':'Search the whole library'}</div>
      <div className="commandResults">{results.length?results.map(s=><button key={s.slug} onClick={()=>go(s.slug)}><span className="commandCode">{suttaDisplayCode(s,vi)}{vi&&<small>{s.code}</small>}</span><span><strong>{vi?s.vi:s.en}</strong><small>{s.pali}</small></span></button>):<p className="commandEmpty">{vi?'Không tìm thấy. Thử mã kinh hoặc từ khóa khác.':'No results.'}</p>}</div>
    </section></div>}
    {menuOpen&&<div className="drawerBackdrop" onMouseDown={()=>setMenuOpen(false)}><aside className="mobileDrawer" onMouseDown={e=>e.stopPropagation()}>
      <div className="drawerHead"><strong>5 Đại Tạng Kinh Nikāya</strong><button onClick={()=>setMenuOpen(false)}><X size={21}/></button></div>
      <nav>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}`}><Home size={19}/>{vi?'Trang chủ':'Home'}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}#collections`}><Library size={19}/>{vi?'5 Đại Tạng':'Collections'}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}#library`}><BookOpen size={19}/>{vi?'Thư viện kinh':'Library'}</Link>
        <Link onClick={()=>setMenuOpen(false)} href={`/${locale}#featured`}><Headphones size={19}/>{vi?'Nghe kinh':'Listen'}</Link>
        <button onClick={()=>{setMenuOpen(false);setSearchOpen(true)}}><Search size={19}/>{vi?'Tìm kiếm toàn thư viện':'Search library'}</button>
      </nav>
      <small className="buildBadge">{RELEASE}</small>
    </aside></div>}
  </>;
}
