'use client';

import {useEffect, useState} from 'react';
import {Bookmark, RotateCcw} from 'lucide-react';

export default function ReaderProgress({id, locale}:{id:string; locale:string}){
  const key=`nikaya:progress:${id}`;
  const [saved,setSaved]=useState<number|null>(null);
  const vi=locale==='vi';

  useEffect(()=>{
    const existing=Number(localStorage.getItem(key));
    if(Number.isFinite(existing) && existing>0) setSaved(existing);
    const save=()=>localStorage.setItem(key,String(Math.max(0,window.scrollY)));
    window.addEventListener('pagehide',save);
    return ()=>{ save(); window.removeEventListener('pagehide',save); };
  },[key]);

  function saveNow(){
    const y=Math.max(0,window.scrollY);
    localStorage.setItem(key,String(y));
    setSaved(y);
  }
  function resume(){ if(saved!==null) window.scrollTo({top:saved,behavior:'smooth'}); }

  return <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button className="btn" onClick={saveNow}><Bookmark size={16}/>{vi?'Lưu vị trí':'Save position'}</button>
    {saved!==null && <button className="btn" onClick={resume}><RotateCcw size={16}/>{vi?'Đọc tiếp':'Resume'}</button>}
  </div>;
}
