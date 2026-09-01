'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {BookOpen,Headphones,Search,SlidersHorizontal,Clock,ArrowUpRight} from 'lucide-react';
import {collections,suttas,suttaDisplayCode,suttaAudio} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

export default function LibraryExplorer({locale,placeholder,initialCollection='ALL'}:{locale:Locale;placeholder:string;initialCollection?:string}){
 const vi=locale==='vi';
 const [q,setQ]=useState('');
 const [collection,setCollection]=useState(initialCollection);
 const [format,setFormat]=useState<'ALL'|'AUDIO'>('ALL');
 const filtered=useMemo(()=>suttas.filter(s=>{
   const collectionName=collections.find(c=>c.code===s.collection);
   const hay=[s.code,s.viCode,s.collection,collectionName?.vi,collectionName?.en,s.pali,s.vi,s.en,s.summaryVi,s.summaryEn,s.practiceVi,s.practiceEn,...s.topics].filter(Boolean).join(' ').toLocaleLowerCase();
   const hasAudio=!!suttaAudio(s,locale);
   const formatOk=format==='ALL'||(format==='AUDIO'&&hasAudio);
   return (collection==='ALL'||s.collection===collection)&&formatOk&&hay.includes(q.trim().toLocaleLowerCase());
 }),[q,collection,format,locale]);
 return <div className="explorer">
   <div className="libraryToolbar"><label className="searchBox"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} aria-label="search" placeholder={placeholder}/>{q&&<button type="button" onClick={()=>setQ('')}>×</button>}</label><div className="formatFilter"><SlidersHorizontal size={17}/><button className={format==='ALL'?'activeFilter':''} onClick={()=>setFormat('ALL')}>{vi?'Tất cả':'All'}</button><button className={format==='AUDIO'?'activeFilter':''} onClick={()=>setFormat('AUDIO')}>{vi?'Có MP3':'Audio'}</button></div></div>
   <div className="collectionChips"><button onClick={()=>setCollection('ALL')} className={collection==='ALL'?'activeChip':''}><strong>{vi?'Tất cả 5 bộ':'All collections'}</strong></button>{collections.map(c=><button onClick={()=>setCollection(c.code)} className={collection===c.code?'activeChip':''} key={c.code}><strong>{vi?c.vi:c.en}</strong><small>{vi?`${c.viCode} · ${c.code}`:c.code}</small></button>)}</div>
   <div className="resultLine"><strong>{filtered.length}</strong> {vi?'bài kinh đang hiển thị':'discourses shown'}</div>
   <div className="suttaGrid">{filtered.length?filtered.map(s=>{const audio=suttaAudio(s,locale);const c=collections.find(x=>x.code===s.collection);return <Link href={`/${locale}/library/${s.slug}`} className="suttaCard" key={s.slug}><div className="suttaCode dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</div><div className="suttaContent"><div className="suttaMeta"><span>{vi?c?.vi:c?.en}</span><span><Clock size={13}/>{s.readMinutes} {vi?'phút':'min'}</span></div><h3>{vi?s.vi:s.en}</h3><p className="pali">{s.pali}</p><p className="summary">{vi?s.summaryVi:s.summaryEn}</p><div className="topicRow">{s.topics.slice(0,3).map(t=><span key={t}>{t}</span>)}</div></div><div className="suttaActions"><span title={vi?'Đọc':'Read'}><BookOpen size={16}/></span>{audio&&<span title={audio.label}><Headphones size={16}/></span>}<ArrowUpRight className="openArrow" size={18}/></div></Link>}):<div className="emptyState"><Search size={26}/><h3>{vi?'Không tìm thấy bài kinh':'No results'}</h3><p>{vi?'Thử TB 21, TrB 1, tên Pāli hoặc một chủ đề.':'Try another code, Pāli title, or broader topic.'}</p></div>}</div>
 </div>;
}
