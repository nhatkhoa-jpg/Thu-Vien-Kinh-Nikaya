'use client';
import {useRef,useState} from 'react';
import {RotateCcw,RotateCw} from 'lucide-react';

const rates=[0.75,1,1.25,1.5,1.75,2];

export default function AudioPlayer({src}:{src:string}){
 const ref=useRef<HTMLAudioElement>(null);
 const [rate,setRate]=useState(1);
 function update(v:number){setRate(v);if(ref.current)ref.current.playbackRate=v;}
 function seek(seconds:number){if(ref.current)ref.current.currentTime=Math.max(0,ref.current.currentTime+seconds);}
 return <div className="audioPlayer">
   <audio ref={ref} controls preload="metadata" src={src}/>
   <div className="audioTools">
     <button onClick={()=>seek(-15)} aria-label="Back 15 seconds"><RotateCcw size={16}/><span>15s</span></button>
     <div className="rateGroup" aria-label="Playback speed">{rates.map(v=><button key={v} className={rate===v?'activeRate':''} onClick={()=>update(v)}>{v}×</button>)}</div>
     <button onClick={()=>seek(15)} aria-label="Forward 15 seconds"><RotateCw size={16}/><span>15s</span></button>
   </div>
 </div>
}
