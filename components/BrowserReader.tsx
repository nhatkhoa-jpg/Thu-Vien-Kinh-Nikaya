'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ChevronDown,Pause,Play,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar',fr:'fr-FR',bn:'bn',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
type ReaderState='idle'|'speaking'|'paused';

function prepare(text:string,vi:boolean){
  let value=text.normalize('NFC').replace(/\u00a0/g,' ').replace(/[–—]/g,', ').replace(/\s+/g,' ').trim();
  if(vi)value=value.replace(/\bSC\s*(\d+)\b/gi,'Đoạn $1.').replace(/\bTB\s*(\d+)\b/g,'Trung Bộ $1').replace(/\bMN\s*(\d+)\b/gi,'M N $1');
  return value;
}
function chunks(text:string,vi:boolean,max=220){
  const input=prepare(text,vi);if(!input)return[];
  const out:string[]=[];let current='';
  for(const sentence of input.split(/(?<=[.!?。！？])\s+/)){
    const s=sentence.trim();if(!s)continue;
    if((current+' '+s).trim().length<=max){current=(current+' '+s).trim();continue;}
    if(current)out.push(current);current='';
    if(s.length<=max){current=s;continue;}
    let rest=s;
    while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<max*.55)cut=max;out.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}
    current=rest;
  }
  if(current)out.push(current);return out;
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const vi=locale==='vi';
  const queue=useMemo(()=>chunks(text,vi),[text,vi]);
  const [ready,setReady]=useState(false);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [state,setState]=useState<ReaderState>('idle');
  const indexRef=useRef(0);const activeRef=useRef(false);const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);

  useEffect(()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setReady(true);return;}
    const synth=window.speechSynthesis;const wanted=(localeVoice[locale]||locale).toLowerCase().replace('_','-');const base=wanted.split('-')[0];
    const load=()=>{const matching=synth.getVoices().filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(base));setVoices(matching);setVoiceUri(old=>old&&matching.some(v=>v.voiceURI===old)?old:(matching.find(v=>v.lang.toLowerCase().replace('_','-')===wanted)||matching[0])?.voiceURI||'');};
    load();const timers=[200,800,1800,3000].map(ms=>setTimeout(()=>{load();if(ms===3000)setReady(true);},ms));
    const changed=()=>{load();setReady(true);};synth.addEventListener?.('voiceschanged',changed);
    return()=>{timers.forEach(clearTimeout);synth.removeEventListener?.('voiceschanged',changed);activeRef.current=false;synth.cancel();};
  },[locale]);

  function finish(){activeRef.current=false;utteranceRef.current=null;indexRef.current=0;setState('idle');}
  function speak(index:number){
    if(!activeRef.current||index>=queue.length){finish();return;}
    const synth=window.speechSynthesis;const live=synth.getVoices();const selected=live.find(v=>v.voiceURI===voiceUri)||voices[0];if(!selected){finish();return;}
    const u=new SpeechSynthesisUtterance(queue[index]);u.voice=selected;u.lang=localeVoice[locale]||locale;u.rate=rate;u.pitch=1;u.volume=1;utteranceRef.current=u;
    u.onstart=()=>setState('speaking');u.onend=()=>{if(activeRef.current){indexRef.current=index+1;setTimeout(()=>speak(index+1),80);}};u.onerror=(e:any)=>{if(e?.error!=='canceled'&&e?.error!=='interrupted')finish();};
    synth.speak(u);
  }
  function start(){if(!queue.length||!voiceUri)return;window.speechSynthesis.cancel();activeRef.current=true;indexRef.current=0;speak(0);}
  function toggle(){const synth=window.speechSynthesis;if(state==='speaking'){synth.pause();setState('paused');return;}if(state==='paused'){synth.resume();setState('speaking');return;}start();}
  function stop(){activeRef.current=false;window.speechSynthesis.cancel();utteranceRef.current=null;indexRef.current=0;setState('idle');}
  function restart(){stop();setTimeout(start,80);}

  if(!ready||!voices.length||!voiceUri)return null;
  return <details className="essentialDisclosure listenDisclosure deviceSpeechDisclosure" id="device-speech">
    <summary title={vi?'Đọc bằng giọng có sẵn trên thiết bị':'Read with a voice installed on this device'}><span className="miniActionIcon"><Volume2 size={17}/></span><span><strong>{vi?'Đọc bằng máy':'Device voice'}</strong><small>{vi?'Chỉ hiện khi máy hỗ trợ':'Available on this device'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary>
    <div className="disclosureBody"><div className="browserReader compactTts deviceOnlyTts">
      <div className="ttsPrimary"><button className="ttsMain" onClick={toggle}>{state==='speaking'?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{state==='speaking'?(vi?'Tạm dừng':'Pause'):state==='paused'?(vi?'Đọc tiếp':'Resume'):(vi?'Nghe bằng máy':'Use device voice')}</button><button className="ttsIcon" onClick={stop} title={vi?'Dừng':'Stop'}><Square size={16}/></button><button className="ttsIcon" onClick={restart} title={vi?'Đọc lại':'Restart'}><RotateCcw size={16}/></button></div>
      <div className="ttsControls"><label><span>{vi?'Giọng':'Voice'}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}>{voices.map(v=><option value={v.voiceURI} key={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label><label><span>{vi?'Tốc độ':'Speed'}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[.8,.9,1,1.1,1.25,1.5].map(v=><option value={v} key={v}>{v}×</option>)}</select></label></div>
    </div></div>
  </details>;
}
