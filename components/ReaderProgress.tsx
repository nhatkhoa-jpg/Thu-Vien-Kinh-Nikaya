'use client';

import {useEffect, useState} from 'react';
import {Bookmark, RotateCcw, Minus, Plus, Moon, Sun} from 'lucide-react';

export default function ReaderProgress({id, locale}:{id:string; locale:string}){
  const key=`nikaya:progress:${id}`;
  const settingsKey='nikaya:reader-settings';
  const [saved,setSaved]=useState<number|null>(null);
  const [size,setSize]=useState(20);
  const [night,setNight]=useState(false);
  const vi=locale==='vi';

  useEffect(()=>{
    const existing=Number(localStorage.getItem(key));
    if(Number.isFinite(existing) && existing>0) setSaved(existing);
    try{
      const settings=JSON.parse(localStorage.getItem(settingsKey)||'{}');
      if(Number.isFinite(settings.size)) setSize(settings.size);
      if(typeof settings.night==='boolean') setNight(settings.night);
    }catch{}
    const save=()=>localStorage.setItem(key,String(Math.max(0,window.scrollY)));
    window.addEventListener('pagehide',save);
    return ()=>{save();window.removeEventListener('pagehide',save);document.body.classList.remove('readerNight');};
  },[key]);

  useEffect(()=>{
    document.documentElement.style.setProperty('--reader-size',`${size}px`);
    document.body.classList.toggle('readerNight',night);
    localStorage.setItem(settingsKey,JSON.stringify({size,night}));
  },[size,night]);

  function saveNow(){const y=Math.max(0,window.scrollY);localStorage.setItem(key,String(y));setSaved(y);}
  function resume(){if(saved!==null)window.scrollTo({top:saved,behavior:'smooth'});}

  return <div className="readerToolbar" aria-label={vi?'Công cụ đọc':'Reader tools'}>
    <div className="readerToolGroup">
      <button onClick={()=>setSize(v=>Math.max(17,v-1))} aria-label="Smaller text"><Minus size={16}/><span>A</span></button>
      <span className="readerSize">{size}</span>
      <button onClick={()=>setSize(v=>Math.min(28,v+1))} aria-label="Larger text"><Plus size={16}/><span>A</span></button>
    </div>
    <button onClick={()=>setNight(v=>!v)}>{night?<Sun size={16}/>:<Moon size={16}/>}<span>{vi?(night?'Sáng':'Tối'):(night?'Light':'Dark')}</span></button>
    <button onClick={saveNow}><Bookmark size={16}/><span>{vi?'Lưu':'Save'}</span></button>
    {saved!==null&&<button onClick={resume}><RotateCcw size={16}/><span>{vi?'Đọc tiếp':'Resume'}</span></button>}
  </div>;
}
