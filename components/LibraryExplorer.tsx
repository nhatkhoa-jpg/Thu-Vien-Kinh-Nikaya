'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BookOpen,Headphones,Search,SlidersHorizontal,Clock,ArrowUpRight} from 'lucide-react';
import {collections,suttas,suttaDisplayCode,suttaAudio} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

const PAGE_SIZE=60;
const collectionNotes:Record<string,{vi:string;en:string}>={
  AN:{vi:'Tăng Chi Bộ có hơn một nghìn bài kinh. Những bài đang thấy ở đây là phần đã mở trong thư viện; các phẩm còn lại đang được bổ sung dần.',en:'The Aṅguttara Nikāya contains well over a thousand discourses. This page shows the portion already opened in the library while the rest is being added.'},
  KN:{vi:'Tiểu Bộ gồm nhiều tập kinh và kệ tụng. Những bài đang thấy ở đây chỉ là phần đã mở trong thư viện; các tập còn lại đang được bổ sung dần.',en:'The Khuddaka Nikāya contains many books of discourses and verses. This page shows the portion already opened in the library while the rest is being added.'},
  MN:{vi:'Trung Bộ gồm 152 bài kinh. Thư viện đang tiếp tục mở toàn bộ bài đọc và audio theo từng đợt.',en:'The Majjhima Nikāya contains 152 discourses. Full reading and audio access is being opened progressively.'},
  SN:{vi:'Tương Ưng Bộ là một kho kinh rất lớn, được sắp theo các nhóm chủ đề. Thư viện đang tiếp tục mở thêm bài đọc theo từng nhóm.',en:'The Saṁyutta Nikāya is a large collection organized by themes. More reading entries are being opened progressively.'}
};

export default function LibraryExplorer({locale,placeholder,initialCollection='ALL'}:{locale:Locale;placeholder:string;initialCollection?:string}){
 const vi=locale==='vi';
 const [q,setQ]=useState('');
 const [collection,setCollection]=useState(initialCollection);
 const [format,setFormat]=useState<'ALL'|'AUDIO'>('ALL');
 const [visibleCount,setVisibleCount]=useState(PAGE_SIZE);
 const filtered=useMemo(()=>suttas.filter(s=>{
   const collectionName=collections.find(c=>c.code===s.collection);
   const hay=[s.code,s.viCode,s.collection,collectionName?.vi,collectionName?.en,s.pali,s.vi,s.en,s.summaryVi,s.summaryEn,s.practiceVi,s.practiceEn,...s.topics].filter(Boolean).join(' ').toLocaleLowerCase();
   const hasAudio=!!suttaAudio(s,locale);
   const formatOk=format==='ALL'||(format==='AUDIO'&&hasAudio);
   return (collection==='ALL'||s.collection===collection)&&formatOk&&hay.includes(q.trim().toLocaleLowerCase());
 }),[q,collection,format,locale]);
 useEffect(()=>setVisibleCount(PAGE_SIZE),[q,collection,format,locale]);
 const visible=filtered.slice(0,visibleCount);
 const selectedNote=collection!=='ALL'?collectionNotes[collection]:undefined;
 const resultText=vi?(collection==='ALL'?`${filtered.length} bài đang mở để đọc`:`${filtered.length} bài đang mở trong ${collections.find(c=>c.code===collection)?.vi||'bộ kinh này'}`):`${filtered.length} ${collection==='ALL'?'discourses ready to open':'discourses currently open in this collection'}`;
 return <div className="explorer">
   <div className="libraryToolbar"><label className="searchBox"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} aria-label="search" placeholder={placeholder}/>{q&&<button type="button" onClick={()=>setQ('')}>×</button>}</label><div className="formatFilter"><SlidersHorizontal size={17}/><button className={format==='ALL'?'activeFilter':''} onClick={()=>setFormat('ALL')}>{vi?'Đọc tất cả':'All reading'}</button><button className={format==='AUDIO'?'activeFilter':''} onClick={()=>setFormat('AUDIO')}>{vi?'Có audio':'With audio'}</button></div></div>
   <div className="collectionChips"><button onClick={()=>setCollection('ALL')} className={collection==='ALL'?'activeChip':''}><strong>{vi?'Tất cả 5 bộ':'All five Nikāyas'}</strong></button>{collections.map(c=><button onClick={()=>setCollection(c.code)} className={collection===c.code?'activeChip':''} key={c.code}><strong>{vi?c.vi:c.en}</strong><small>{vi?c.viCode:c.code}</small></button>)}</div>
   <div className="resultLine"><strong>{resultText}</strong>{filtered.length>visible.length&&<span> · {vi?`đang hiện ${visible.length}`:`showing ${visible.length}`}</span>}</div>
   {selectedNote&&<div className="emptyState" style={{marginBottom:'18px'}}><BookOpen size={22}/><h3>{vi?'Bộ kinh còn đang được mở rộng':'This collection is still expanding'}</h3><p>{vi?selectedNote.vi:selectedNote.en}</p></div>}
   <div className="suttaGrid">{visible.length?visible.map(s=>{const audio=suttaAudio(s,locale);const c=collections.find(x=>x.code===s.collection);const summary=vi?s.summaryVi:s.summaryEn;return <Link href={`/${locale}/library/${s.slug}`} className="suttaCard" key={s.slug}><div className="suttaCode dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</div><div className="suttaContent"><div className="suttaMeta"><span>{vi?c?.vi:c?.en}</span>{s.readMinutes>0&&<span><Clock size={13}/>{s.readMinutes} {vi?'phút':'min'}</span>}</div><h3>{vi?s.vi:s.en}</h3><p className="pali">{s.pali}</p>{summary&&<p className="summary">{summary}</p>}<div className="topicRow">{s.topics.slice(0,3).map(t=><span key={t}>{t}</span>)}</div></div><div className="suttaActions"><span title={vi?'Đọc':'Read'}><BookOpen size={16}/></span>{audio&&<span title={audio.label}><Headphones size={16}/></span>}<ArrowUpRight className="openArrow" size={18}/></div></Link>}):<div className="emptyState"><Search size={26}/><h3>{vi?'Chưa thấy bài phù hợp':'No matching discourse yet'}</h3><p>{vi?'Thử tên kinh, mã số, một từ Pāli hoặc chủ đề rộng hơn.':'Try a title, code, Pāli word, or a broader topic.'}</p></div>}</div>
   {visible.length<filtered.length&&<div className="loadMoreRow"><button type="button" className="btn btnGhost" onClick={()=>setVisibleCount(n=>n+PAGE_SIZE)}>{vi?`Xem thêm ${Math.min(PAGE_SIZE,filtered.length-visible.length)} bài`:`Show ${Math.min(PAGE_SIZE,filtered.length-visible.length)} more`}</button></div>}
 </div>;
}
