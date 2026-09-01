'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {BookOpen,Download,Headphones,Search,SlidersHorizontal,Clock,ArrowUpRight} from 'lucide-react';
import {collections,suttas} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

export default function LibraryExplorer({locale,placeholder}:{locale:Locale;placeholder:string}){
 const vi=locale==='vi';
 const [q,setQ]=useState('');
 const [collection,setCollection]=useState('ALL');
 const [format,setFormat]=useState<'ALL'|'AUDIO'|'BOOK'>('ALL');
 const filtered=useMemo(()=>suttas.filter(s=>{
   const hay=[s.code,s.collection,s.pali,s.vi,s.en,...s.topics].join(' ').toLocaleLowerCase();
   const formatOk=format==='ALL'||(format==='AUDIO'&&!!s.mp3Url)||(format==='BOOK'&&!!s.bookUrl);
   return (collection==='ALL'||s.collection===collection)&&formatOk&&hay.includes(q.trim().toLocaleLowerCase());
 }),[q,collection,format]);
 return <div className="explorer">
   <div className="libraryToolbar">
     <label className="searchBox"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} aria-label="search" placeholder={placeholder}/>{q&&<button type="button" onClick={()=>setQ('')}>×</button>}</label>
     <div className="formatFilter"><SlidersHorizontal size={17}/><button className={format==='ALL'?'activeFilter':''} onClick={()=>setFormat('ALL')}>{vi?'Tất cả':'All'}</button><button className={format==='AUDIO'?'activeFilter':''} onClick={()=>setFormat('AUDIO')}>Audio</button><button className={format==='BOOK'?'activeFilter':''} onClick={()=>setFormat('BOOK')}>PDF</button></div>
   </div>
   <div className="collectionChips"><button onClick={()=>setCollection('ALL')} className={collection==='ALL'?'activeChip':''}>{vi?'Tất cả tạng':'All'}</button>{collections.map(c=><button onClick={()=>setCollection(c.code)} className={collection===c.code?'activeChip':''} key={c.code}>{c.code}<span>{vi?c.vi:c.en}</span></button>)}</div>
   <div className="resultLine"><strong>{filtered.length}</strong> {vi?'bài kinh đang hiển thị':'discourses shown'}</div>
   <div className="suttaGrid">{filtered.length?filtered.map(s=><Link href={`/${locale}/library/${s.slug}`} className="suttaCard" key={s.slug}>
      <div className="suttaCode">{s.code}</div>
      <div className="suttaContent"><div className="suttaMeta"><span>{s.collection}</span><span><Clock size={13}/>{s.readMinutes} {vi?'phút':'min'}</span></div><h3>{vi?s.vi:s.en}</h3><p className="pali">{s.pali}</p><p className="summary">{vi?s.summaryVi:s.summaryEn}</p><div className="topicRow">{s.topics.slice(0,3).map(t=><span key={t}>{t}</span>)}</div></div>
      <div className="suttaActions"><span title="Read"><BookOpen size={16}/></span>{s.mp3Url&&<span title="Audio"><Headphones size={16}/></span>}{s.bookUrl&&<span title="Download"><Download size={16}/></span>}<ArrowUpRight className="openArrow" size={18}/></div>
   </Link>):<div className="emptyState"><Search size={26}/><h3>{vi?'Không tìm thấy bài kinh':'No results'}</h3><p>{vi?'Thử mã kinh khác, tên Pāli hoặc chủ đề rộng hơn.':'Try another code, Pāli title, or broader topic.'}</p></div>}</div>
 </div>
}
