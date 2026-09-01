'use client';
import {useEffect,useRef,useState} from 'react';
import {RotateCcw,RotateCw} from 'lucide-react';

const rates=[0.75,1,1.25,1.5,1.75,2];

export default function AudioPlayer({src,storageKey}:{src:string;storageKey?:string}){
 const ref=useRef<HTMLAudioElement>(null);
 const lastSavedRef=useRef(0);
 const [rate,setRate]=useState(1);
 const key=`nikaya:audio:${storageKey||src}`;

 useEffect(()=>{
   const audio=ref.current;if(!audio)return;
   audio.playbackRate=rate;audio.preservesPitch=true;
 },[rate,src]);

 function update(v:number){setRate(v);if(ref.current){ref.current.playbackRate=v;ref.current.preservesPitch=true;}}
 function seek(seconds:number){
   const audio=ref.current;if(!audio)return;
   const max=Number.isFinite(audio.duration)?audio.duration:Infinity;
   audio.currentTime=Math.min(max,Math.max(0,audio.currentTime+seconds));
   save(true);
 }
 function save(force=false){
   const audio=ref.current;if(!audio||!Number.isFinite(audio.currentTime))return;
   const now=Date.now();if(!force&&now-lastSavedRef.current<2000)return;lastSavedRef.current=now;
   try{localStorage.setItem(key,JSON.stringify({time:audio.currentTime,rate,updatedAt:now}));}catch{}
 }
 function restore(){
   const audio=ref.current;if(!audio)return;
   try{
     const value=JSON.parse(localStorage.getItem(key)||'null');
     if(value&&Number.isFinite(value.time)&&value.time>4&&(!Number.isFinite(audio.duration)||value.time<audio.duration-8))audio.currentTime=value.time;
     if(value&&rates.includes(Number(value.rate))){const r=Number(value.rate);setRate(r);audio.playbackRate=r;audio.preservesPitch=true;}
   }catch{}
 }
 function finished(){try{localStorage.removeItem(key);}catch{}}

 return <div className="audioPlayer">
   <audio ref={ref} controls preload="metadata" src={src} onLoadedMetadata={restore} onTimeUpdate={()=>save(false)} onPause={()=>save(true)} onEnded={finished}/>
   <div className="audioTools">
     <button onClick={()=>seek(-15)} aria-label="Back 15 seconds"><RotateCcw size={16}/><span>15s</span></button>
     <div className="rateGroup" aria-label="Playback speed">{rates.map(v=><button key={v} className={rate===v?'activeRate':''} onClick={()=>update(v)}>{v}×</button>)}</div>
     <button onClick={()=>seek(15)} aria-label="Forward 15 seconds"><RotateCw size={16}/><span>15s</span></button>
   </div>
 </div>
}
