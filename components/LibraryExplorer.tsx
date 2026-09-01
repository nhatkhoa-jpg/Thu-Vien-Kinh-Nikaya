'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {BookOpen,FileDown,Headphones,Search} from 'lucide-react';
import {collections,suttas} from '@/lib/data';
import type {Locale} from '@/lib/i18n';

export default function LibraryExplorer({locale,placeholder}:{locale:Locale;placeholder:string}){
 const vi=locale==='vi'; const [q,setQ]=useState(''); const [collection,setCollection]=useState('ALL');
 const filtered=useMemo(()=>suttas.filter(s=>{
   const hay=[s.code,s.collection,s.pali,s.vi,s.en,...s.topics].join(' ').toLocaleLowerCase();
   return (collection==='ALL'||s.collection===collection) && hay.includes(q.trim().toLocaleLowerCase());
 }),[q,collection]);
 return <>
   <div className="sectionHead"><div><h2>{vi?'Bắt đầu từ các bài kinh tiêu biểu':'Start with selected discourses'}</h2><p>{vi?'Tìm nhanh theo tên, mã kinh, Pāli hoặc chủ đề.':'Search by title, code, Pāli, or topic.'}</p></div><label className="searchBox"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} aria-label="search" placeholder={placeholder}/></label></div>
   <div className="library"><aside className="filters"><h3>{vi?'Bộ kinh':'Collection'}</h3><div className="chips"><button onClick={()=>setCollection('ALL')} className={`chip ${collection==='ALL'?'activeChip':''}`}>{vi?'Tất cả':'All'}</button>{collections.map(c=><button onClick={()=>setCollection(c.code)} className={`chip ${collection===c.code?'activeChip':''}`} key={c.code}>{c.code}</button>)}</div><h3 style={{marginTop:24}}>{vi?'Gợi ý chủ đề':'Topic ideas'}</h3><div className="chips">{['tứ diệu đế','tâm từ','chánh niệm','nhẫn nhục'].map(t=><button className="chip" key={t} onClick={()=>setQ(t)}>{t}</button>)}</div></aside>
   <div className="list">{filtered.length?filtered.map(s=><Link href={`/${locale}/library/${s.slug}`} className="item" key={s.slug}><div className="itemCode">{s.code}</div><div><h3>{vi?s.vi:s.en}</h3><p>{s.pali} · {vi?s.summaryVi:s.summaryEn}</p></div><div className="badges"><span className="badge"><BookOpen size={11}/> Read</span>{s.pdfUrl&&<span className="badge"><FileDown size={11}/> PDF</span>}{s.mp3Url&&<span className="badge"><Headphones size={11}/> MP3</span>}</div></Link>):<div className="feature"><h3>{vi?'Không tìm thấy':'No results'}</h3><p>{vi?'Thử tên khác, mã kinh hoặc chủ đề rộng hơn.':'Try another title, code, or broader topic.'}</p></div>}</div></div>
 </>
}
