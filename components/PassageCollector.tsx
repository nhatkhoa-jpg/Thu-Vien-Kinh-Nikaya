'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Bookmark,BookmarkCheck,Copy,Library} from 'lucide-react';

export type PassageSegment={id:string;text:string};
export type SavedPassage={key:string;canonicalRef:string;segmentId:string;displayCode:string;title:string;slug:string;locale:string;text:string;savedAt:string};
export const PASSAGE_KEY='nikaya:saved-passages:v1';

function readSaved():SavedPassage[]{
  try{const v=JSON.parse(localStorage.getItem(PASSAGE_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return[];}
}
function safeId(id:string){return id.replace(/[^a-zA-Z0-9_-]/g,'-');}

export default function PassageCollector({segments,canonicalRef,displayCode,title,slug,locale}:{segments:PassageSegment[];canonicalRef:string;displayCode:string;title:string;slug:string;locale:string}){
  const vi=locale==='vi';
  const [saved,setSaved]=useState<SavedPassage[]>([]);
  const [copied,setCopied]=useState<string|null>(null);
  useEffect(()=>{setSaved(readSaved())},[]);
  const savedKeys=useMemo(()=>new Set(saved.map(x=>x.key)),[saved]);
  const currentCount=useMemo(()=>saved.filter(x=>x.canonicalRef===canonicalRef&&x.locale===locale).length,[saved,canonicalRef,locale]);
  function persist(next:SavedPassage[]){setSaved(next);localStorage.setItem(PASSAGE_KEY,JSON.stringify(next));window.dispatchEvent(new Event('nikaya-passages-changed'));}
  function toggle(seg:PassageSegment){
    const key=`${locale}:${canonicalRef}:${seg.id}`;
    if(savedKeys.has(key))persist(saved.filter(x=>x.key!==key));
    else persist([{key,canonicalRef,segmentId:seg.id,displayCode,title,slug,locale,text:seg.text,savedAt:new Date().toISOString()},...saved].slice(0,1000));
  }
  async function copy(seg:PassageSegment){
    try{await navigator.clipboard.writeText(`${seg.text}\n\n— ${displayCode} · ${title}`);setCopied(seg.id);setTimeout(()=>setCopied(null),1400);}catch{}
  }
  return <div className="passageCollector">
    <div className="passageCollectorBar"><span><Library size={15}/>{vi?'Sưu tầm đoạn kinh':'Passage collection'}</span><Link href={`/${locale}/bo-suu-tap`}>{vi?`Đã lưu ${currentCount} đoạn`:`${currentCount} saved`}</Link></div>
    <div className="fullTextBody passageBody">{segments.map(seg=>{const key=`${locale}:${canonicalRef}:${seg.id}`;const isSaved=savedKeys.has(key);return <div className={`passageRow ${isSaved?'isSaved':''}`} key={seg.id}><p id={safeId(seg.id)}>{seg.text}</p><div className="passageActions"><button type="button" onClick={()=>toggle(seg)} title={vi?(isSaved?'Bỏ lưu đoạn':'Lưu đoạn kinh'):(isSaved?'Remove saved passage':'Save passage')} aria-label={vi?(isSaved?'Bỏ lưu đoạn':'Lưu đoạn kinh'):(isSaved?'Remove saved passage':'Save passage')}>{isSaved?<BookmarkCheck size={15}/>:<Bookmark size={15}/>}</button><button type="button" onClick={()=>copy(seg)} title={vi?'Sao chép đoạn':'Copy passage'} aria-label={vi?'Sao chép đoạn':'Copy passage'}><Copy size={15}/>{copied===seg.id&&<small>{vi?'Đã chép':'Copied'}</small>}</button></div></div>})}</div>
  </div>;
}
