'use client';
import {useRef,useState} from 'react';
export default function AudioPlayer({src}:{src:string}){
 const ref=useRef<HTMLAudioElement>(null); const [rate,setRate]=useState('1');
 function update(v:string){setRate(v);if(ref.current)ref.current.playbackRate=Number(v);}
 return <div><audio ref={ref} controls preload="metadata" src={src} style={{width:'100%'}}/><div className="downloadRow"><label style={{fontSize:12,color:'var(--muted)'}}>Speed <select className="lang" value={rate} onChange={e=>update(e.target.value)}><option>0.75</option><option>1</option><option>1.25</option><option>1.5</option><option>1.75</option><option>2</option></select></label></div></div>
}
