'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {RotateCcw,RotateCw} from 'lucide-react';

const rates=[0.75,1,1.25,1.5,1.75,2];

type AudioSource={url:string;provider?:string};
export type AudioSegment={id:string;duration?:number;sources:AudioSource[]};
type PreservationManifest={version?:string;segments?:AudioSegment[]};

export default function AudioPlayer({src,segments,manifestUrl,storageKey}:{src?:string;segments?:AudioSegment[];manifestUrl?:string;storageKey?:string}){
 const ref=useRef<HTMLAudioElement>(null);
 const lastSavedRef=useRef(0);
 const [rate,setRate]=useState(1);
 const [segmentIndex,setSegmentIndex]=useState(0);
 const [sourceIndex,setSourceIndex]=useState(0);
 const [remoteSegments,setRemoteSegments]=useState<AudioSegment[]|null>(null);

 useEffect(()=>{
   let cancelled=false;
   setRemoteSegments(null);
   if(!manifestUrl)return;
   fetch(manifestUrl,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}).then((m:PreservationManifest)=>{
     if(cancelled||!Array.isArray(m.segments)||!m.segments.length)return;
     const valid=m.segments.filter(x=>x&&typeof x.id==='string'&&Array.isArray(x.sources)&&x.sources.some(s=>typeof s?.url==='string'&&s.url));
     if(valid.length)setRemoteSegments(valid);
   }).catch(()=>{});
   return()=>{cancelled=true;};
 },[manifestUrl]);

 const playlist=useMemo<AudioSegment[]>(()=>remoteSegments?.length?remoteSegments:(segments?.length?segments:(src?[{id:'legacy-1',sources:[{url:src,provider:'Legacy MP3'}]}]:[])),[remoteSegments,segments,src]);
 const segment=playlist[segmentIndex];
 const currentSrc=segment?.sources[sourceIndex]?.url;
 const key=`nikaya:audio:${storageKey||src||manifestUrl||playlist.map(x=>x.id).join('|')}`;

 useEffect(()=>{
   const audio=ref.current;if(!audio)return;
   audio.playbackRate=rate;audio.preservesPitch=true;
 },[rate,currentSrc]);

 useEffect(()=>{setSegmentIndex(0);setSourceIndex(0);},[storageKey,src,segments,manifestUrl]);
 useEffect(()=>{if(segmentIndex>=playlist.length){setSegmentIndex(0);setSourceIndex(0);}},[playlist.length,segmentIndex]);

 function update(v:number){setRate(v);if(ref.current){ref.current.playbackRate=v;ref.current.preservesPitch=true;save(true,{rate:v});}}
 function seek(seconds:number){
   const audio=ref.current;if(!audio)return;
   if(seconds<0&&audio.currentTime+seconds<0&&segmentIndex>0){setSegmentIndex(i=>Math.max(0,i-1));setSourceIndex(0);return;}
   const max=Number.isFinite(audio.duration)?audio.duration:Infinity;
   if(seconds>0&&Number.isFinite(audio.duration)&&audio.currentTime+seconds>audio.duration&&segmentIndex<playlist.length-1){setSegmentIndex(i=>Math.min(playlist.length-1,i+1));setSourceIndex(0);return;}
   audio.currentTime=Math.min(max,Math.max(0,audio.currentTime+seconds));save(true);
 }
 function save(force=false,override?:{rate?:number}){
   const audio=ref.current;if(!audio||!Number.isFinite(audio.currentTime))return;
   const now=Date.now();if(!force&&now-lastSavedRef.current<2000)return;lastSavedRef.current=now;
   try{localStorage.setItem(key,JSON.stringify({segmentIndex,time:audio.currentTime,rate:override?.rate??rate,updatedAt:now}));}catch{}
 }
 function restore(){
   const audio=ref.current;if(!audio)return;
   try{
     const value=JSON.parse(localStorage.getItem(key)||'null');
     const savedSegment=Number(value?.segmentIndex);
     if(Number.isInteger(savedSegment)&&savedSegment>=0&&savedSegment<playlist.length&&savedSegment!==segmentIndex){setSegmentIndex(savedSegment);setSourceIndex(0);return;}
     if(value&&Number.isFinite(value.time)&&value.time>4&&(!Number.isFinite(audio.duration)||value.time<audio.duration-8))audio.currentTime=value.time;
     if(value&&rates.includes(Number(value.rate))){const r=Number(value.rate);setRate(r);audio.playbackRate=r;audio.preservesPitch=true;}
   }catch{}
 }
 async function nextSegment(){
   if(segmentIndex<playlist.length-1){save(true);setSegmentIndex(i=>i+1);setSourceIndex(0);return;}
   try{localStorage.removeItem(key);}catch{}
 }
 function fallbackSource(){
   const sources=segment?.sources||[];
   if(sourceIndex<sources.length-1){setSourceIndex(i=>i+1);return;}
   if(remoteSegments?.length&&src){setRemoteSegments(null);setSegmentIndex(0);setSourceIndex(0);return;}
   void nextSegment();
 }
 useEffect(()=>{
   const audio=ref.current;if(!audio||!currentSrc)return;
   if(segmentIndex>0||sourceIndex>0){audio.load();audio.playbackRate=rate;audio.preservesPitch=true;void audio.play().catch(()=>{});}
 },[segmentIndex,sourceIndex,currentSrc,rate]);

 if(!currentSrc)return null;
 const provider=segment?.sources[sourceIndex]?.provider;
 return <div className="audioPlayer" data-segment={`${segmentIndex+1}/${playlist.length}`}>
   <audio ref={ref} controls preload="metadata" src={currentSrc} onLoadedMetadata={restore} onTimeUpdate={()=>save(false)} onPause={()=>save(true)} onEnded={()=>void nextSegment()} onError={fallbackSource}/>
   <div className="audioTools">
     <button onClick={()=>seek(-15)} aria-label="Back 15 seconds"><RotateCcw size={16}/><span>15s</span></button>
     <div className="rateGroup" aria-label="Playback speed">{rates.map(v=><button key={v} className={rate===v?'activeRate':''} onClick={()=>update(v)}>{v}×</button>)}</div>
     <button onClick={()=>seek(15)} aria-label="Forward 15 seconds"><RotateCw size={16}/><span>15s</span></button>
   </div>
   {playlist.length>1&&<div className="audioSegmentStatus">Đoạn {segmentIndex+1}/{playlist.length}{provider?` · ${provider}`:''}</div>}
 </div>
}
