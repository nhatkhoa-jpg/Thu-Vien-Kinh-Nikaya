'use client';

import {useEffect,useState} from 'react';
import {Bookmark,RotateCcw,Minus,Plus,Moon,Sun,AlignJustify,Maximize2} from 'lucide-react';

export default function ReaderProgress({id,locale}:{id:string;locale:string}){
  const key=`nikaya:progress:${id}`;
  const settingsKey='nikaya:reader-settings';
  const [saved,setSaved]=useState<number|null>(null);
  const [size,setSize]=useState(20);
  const [night,setNight]=useState(false);
  const [leading,setLeading]=useState(1.9);
  const [width,setWidth]=useState(780);
  const vi=locale==='vi';

  useEffect(()=>{
    const existing=Number(localStorage.getItem(key));
    if(Number.isFinite(existing)&&existing>0)setSaved(existing);
    try{
      const settings=JSON.parse(localStorage.getItem(settingsKey)||'{}');
      if(Number.isFinite(settings.size))setSize(Number(settings.size));
      if(typeof settings.night==='boolean')setNight(settings.night);
      if(Number.isFinite(settings.leading))setLeading(Number(settings.leading));
      if(Number.isFinite(settings.width))setWidth(Number(settings.width));
    }catch{}
    const save=()=>localStorage.setItem(key,String(Math.max(0,window.scrollY)));
    window.addEventListener('pagehide',save);
    return()=>{save();window.removeEventListener('pagehide',save);document.body.classList.remove('readerNight');};
  },[key]);

  useEffect(()=>{
    document.documentElement.style.setProperty('--reader-size',`${size}px`);
    document.documentElement.style.setProperty('--reader-leading',String(leading));
    document.documentElement.style.setProperty('--reader-width',`${width}px`);
    document.body.classList.toggle('readerNight',night);
    localStorage.setItem(settingsKey,JSON.stringify({size,night,leading,width}));
  },[size,night,leading,width]);

  function saveNow(){const y=Math.max(0,window.scrollY);localStorage.setItem(key,String(y));setSaved(y);}
  function resume(){if(saved!==null)window.scrollTo({top:saved,behavior:'smooth'});}
  function cycleLeading(){setLeading(v=>v<1.8?1.9:v<2?2.1:1.7);}
  function cycleWidth(){setWidth(v=>v<740?780:v<850?920:680);}

  return <div className="readerToolbar" aria-label={vi?'Công cụ đọc':'Reader tools'}>
    <div className="readerToolGroup">
      <button onClick={()=>setSize(v=>Math.max(17,v-1))} aria-label={vi?'Giảm cỡ chữ':'Smaller text'}><Minus size={16}/><span>A</span></button>
      <span className="readerSize">{size}</span>
      <button onClick={()=>setSize(v=>Math.min(28,v+1))} aria-label={vi?'Tăng cỡ chữ':'Larger text'}><Plus size={16}/><span>A</span></button>
    </div>
    <button onClick={cycleLeading} title={vi?'Đổi khoảng dòng':'Change line spacing'}><AlignJustify size={16}/><span>{leading.toFixed(1)}×</span></button>
    <button onClick={cycleWidth} title={vi?'Đổi bề rộng trang đọc':'Change reading width'}><Maximize2 size={16}/><span>{width<740?(vi?'Hẹp':'Narrow'):width<850?(vi?'Vừa':'Comfort'):(vi?'Rộng':'Wide')}</span></button>
    <button onClick={()=>setNight(v=>!v)}>{night?<Sun size={16}/>:<Moon size={16}/>}<span>{vi?(night?'Sáng':'Tối'):(night?'Light':'Dark')}</span></button>
    <button onClick={saveNow}><Bookmark size={16}/><span>{vi?'Lưu vị trí':'Save position'}</span></button>
    {saved!==null&&<button onClick={resume}><RotateCcw size={16}/><span>{vi?'Đọc tiếp':'Resume'}</span></button>}
  </div>;
}
