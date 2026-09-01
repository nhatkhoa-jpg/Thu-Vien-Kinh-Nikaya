'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BookmarkX,Copy,Search} from 'lucide-react';
import {PASSAGE_KEY,type SavedPassage} from './PassageCollector';

function readSaved():SavedPassage[]{try{const v=JSON.parse(localStorage.getItem(PASSAGE_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function safeId(id:string){return id.replace(/[^a-zA-Z0-9_-]/g,'-')}

export default function SavedPassagesClient({locale}:{locale:string}){
 const vi=locale==='vi';const [items,setItems]=useState<SavedPassage[]>([]);const [q,setQ]=useState('');const [copied,setCopied]=useState<string|null>(null);
 useEffect(()=>{const sync=()=>setItems(readSaved());sync();window.addEventListener('nikaya-passages-changed',sync);return()=>window.removeEventListener('nikaya-passages-changed',sync)},[]);
 const filtered=useMemo(()=>{const n=q.trim().toLocaleLowerCase();return items.filter(x=>x.locale===locale&&(!n||[x.displayCode,x.title,x.text,x.canonicalRef].join(' ').toLocaleLowerCase().includes(n)))},[items,q,locale]);
 function remove(key:string){const next=items.filter(x=>x.key!==key);setItems(next);localStorage.setItem(PASSAGE_KEY,JSON.stringify(next));}
 async function copy(x:SavedPassage){try{await navigator.clipboard.writeText(`${x.text}\n\n— ${x.displayCode} · ${x.title}`);setCopied(x.key);setTimeout(()=>setCopied(null),1200)}catch{}}
 return <div className="savedPassagesApp"><label className="searchBox savedSearch"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={vi?'Tìm trong các đoạn đã lưu...':'Search saved passages...'}/></label><div className="savedCount"><strong>{filtered.length}</strong> {vi?'đoạn kinh':'passages'}</div>{filtered.length?<div className="savedPassageList">{filtered.map(x=><article key={x.key} className="savedPassageCard"><div className="savedPassageMeta"><span>{x.displayCode}</span><strong>{x.title}</strong></div><p>{x.text}</p><div className="savedPassageActions"><Link href={`/${locale}/library/${x.slug}#${safeId(x.segmentId)}`}>{vi?'Mở trong bài kinh':'Open in discourse'}</Link><button onClick={()=>copy(x)}><Copy size={14}/>{copied===x.key?(vi?'Đã chép':'Copied'):(vi?'Sao chép':'Copy')}</button><button className="dangerMini" onClick={()=>remove(x.key)}><BookmarkX size={14}/>{vi?'Bỏ lưu':'Remove'}</button></div></article>)}</div>:<div className="emptyState savedEmpty"><h3>{vi?'Chưa lưu đoạn kinh nào':'No saved passages yet'}</h3><p>{vi?'Trong phần toàn văn, bấm biểu tượng bookmark cạnh một đoạn để đưa vào bộ sưu tập này.':'Use the bookmark next to a full-text passage to save it here.'}</p></div>}</div>
}
