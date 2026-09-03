'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Bookmark,BookmarkCheck,Copy,Library} from 'lucide-react';
import {publicUi} from '@/lib/public-ui';
import type {Locale} from '@/lib/i18n';

export type PassageSegment={id:string;text:string};
export type SavedPassage={key:string;canonicalRef:string;segmentId:string;displayCode:string;title:string;slug:string;locale:string;text:string;savedAt:string};
export const PASSAGE_KEY='nikaya:saved-passages:v1';

function readSaved():SavedPassage[]{
  try{const v=JSON.parse(localStorage.getItem(PASSAGE_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return[];}
}
function safeId(id:string){return id.replace(/[^a-zA-Z0-9_-]/g,'-');}

const actionLabels:Record<string,{remove:string;save:string;copy:string;copied:string}>={
 vi:{remove:'Bỏ lưu đoạn',save:'Lưu đoạn kinh',copy:'Sao chép đoạn',copied:'Đã chép'},en:{remove:'Remove saved passage',save:'Save passage',copy:'Copy passage',copied:'Copied'},
 th:{remove:'ยกเลิกการบันทึก',save:'บันทึกข้อความ',copy:'คัดลอกข้อความ',copied:'คัดลอกแล้ว'},my:{remove:'သိမ်းထားမှု ဖယ်ရှား',save:'ကျမ်းပိုဒ် သိမ်းရန်',copy:'ကျမ်းပိုဒ် ကူးယူ',copied:'ကူးယူပြီး'},
 si:{remove:'සුරැකීම ඉවත් කරන්න',save:'පාඨ කොටස සුරකින්න',copy:'පාඨය පිටපත් කරන්න',copied:'පිටපත් කළා'},km:{remove:'ដកចេញពីការរក្សាទុក',save:'រក្សាទុកកថាខណ្ឌ',copy:'ចម្លងកថាខណ្ឌ',copied:'បានចម្លង'},
 lo:{remove:'ຍົກເລີກການບັນທຶກ',save:'ບັນທຶກຂໍ້ຄວາມ',copy:'ສຳເນົາຂໍ້ຄວາມ',copied:'ສຳເນົາແລ້ວ'},zh:{remove:'取消保存',save:'保存经文段落',copy:'复制段落',copied:'已复制'}
};

export default function PassageCollector({segments,canonicalRef,displayCode,title,slug,locale}:{segments:PassageSegment[];canonicalRef:string;displayCode:string;title:string;slug:string;locale:string}){
  const u=publicUi(locale as Locale);const a=actionLabels[locale]||actionLabels.en;
  const [saved,setSaved]=useState<SavedPassage[]>([]);const [copied,setCopied]=useState<string|null>(null);
  useEffect(()=>{setSaved(readSaved())},[]);
  const savedKeys=useMemo(()=>new Set(saved.map(x=>x.key)),[saved]);
  const currentCount=useMemo(()=>saved.filter(x=>x.canonicalRef===canonicalRef&&x.locale===locale).length,[saved,canonicalRef,locale]);
  function persist(next:SavedPassage[]){setSaved(next);localStorage.setItem(PASSAGE_KEY,JSON.stringify(next));window.dispatchEvent(new Event('nikaya-passages-changed'));}
  function toggle(seg:PassageSegment){const key=`${locale}:${canonicalRef}:${seg.id}`;if(savedKeys.has(key))persist(saved.filter(x=>x.key!==key));else persist([{key,canonicalRef,segmentId:seg.id,displayCode,title,slug,locale,text:seg.text,savedAt:new Date().toISOString()},...saved].slice(0,1000));}
  async function copy(seg:PassageSegment){try{await navigator.clipboard.writeText(`${seg.text}\n\n— ${displayCode} · ${title}`);setCopied(seg.id);setTimeout(()=>setCopied(null),1400);}catch{}}
  return <div className="passageCollector">
    <div className="passageCollectorBar"><span><Library size={15}/>{u.passageCollection}</span><Link href={`/${locale}/bo-suu-tap`}>{currentCount} {u.savedCount}</Link></div>
    <div className="fullTextBody passageBody">{segments.map(seg=>{const key=`${locale}:${canonicalRef}:${seg.id}`;const isSaved=savedKeys.has(key);return <div className={`passageRow ${isSaved?'isSaved':''}`} key={seg.id}><p id={safeId(seg.id)}>{seg.text}</p><div className="passageActions"><button type="button" onClick={()=>toggle(seg)} title={isSaved?a.remove:a.save} aria-label={isSaved?a.remove:a.save}>{isSaved?<BookmarkCheck size={15}/>:<Bookmark size={15}/>}</button><button type="button" onClick={()=>copy(seg)} title={a.copy} aria-label={a.copy}><Copy size={15}/>{copied===seg.id&&<small>{a.copied}</small>}</button></div></div>})}</div>
  </div>;
}
