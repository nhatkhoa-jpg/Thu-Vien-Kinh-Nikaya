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

  return <div className="readerToolbar compactReaderToolbar" aria-label={vi?'Công cụ đọc':'Reader tools'}>
    <button onClick={()=>setSize(v=>Math.max(17,v-1))} title={vi?'Giảm cỡ chữ':'Smaller text'} aria-label={vi?'Giảm cỡ chữ':'Smaller text'}><Minus size={16}/><small>A</small></button>
    <span className="readerMiniValue" title={vi?'Cỡ chữ hiện tại':'Current text size'}>{size}</span>
    <button onClick={()=>setSize(v=>Math.min(28,v+1))} title={vi?'Tăng cỡ chữ':'Larger text'} aria-label={vi?'Tăng cỡ chữ':'Larger text'}><Plus size={16}/><small>A</small></button>
    <button onClick={cycleLeading} title={vi?`Khoảng dòng ${leading.toFixed(1)}×`:`Line spacing ${leading.toFixed(1)}×`} aria-label={vi?'Đổi khoảng dòng':'Change line spacing'}><AlignJustify size={17}/><small>{leading.toFixed(1)}</small></button>
    <button onClick={cycleWidth} title={vi?'Đổi bề rộng trang đọc':'Change reading width'} aria-label={vi?'Đổi bề rộng trang đọc':'Change reading width'}><Maximize2 size={17}/><small>{width<740?'S':width<850?'M':'L'}</small></button>
    <button onClick={()=>setNight(v=>!v)} title={vi?(night?'Nền sáng':'Nền tối'):(night?'Light mode':'Dark mode')} aria-label={vi?'Đổi nền đọc':'Toggle reading theme'}>{night?<Sun size={17}/>:<Moon size={17}/>}</button>
    <button onClick={saveNow} title={vi?'Lưu vị trí đang đọc':'Save reading position'} aria-label={vi?'Lưu vị trí':'Save position'}><Bookmark size={17}/></button>
    {saved!==null&&<button onClick={resume} title={vi?'Quay lại vị trí đã lưu':'Resume saved position'} aria-label={vi?'Đọc tiếp':'Resume'}><RotateCcw size={17}/></button>}
  </div>;
}
