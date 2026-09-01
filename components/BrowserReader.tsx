'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Pause,Play,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar-SA',fr:'fr-FR',bn:'bn-BD',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur-PK',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};

function chunkText(text:string,max=650){
  const paragraphs=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const out:string[]=[];
  for(const paragraph of paragraphs){
    const sentences=paragraph.split(/(?<=[.!?。！？])\s+/);
    let buf='';
    for(const sentence of sentences){
      if((buf+' '+sentence).trim().length>max&&buf){out.push(buf.trim());buf=sentence;}
      else buf=(buf+' '+sentence).trim();
    }
    if(buf)out.push(buf);
  }
  return out;
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const chunks=useMemo(()=>chunkText(text),[text]);
  const [supported,setSupported]=useState(true);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [speaking,setSpeaking]=useState(false);
  const [paused,setPaused]=useState(false);
  const queueRef=useRef<string[]>([]);
  const indexRef=useRef(0);
  const activeRef=useRef(false);

  useEffect(()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setSupported(false);return;}
    const load=()=>{
      const all=window.speechSynthesis.getVoices();
      const wanted=(localeVoice[locale]||locale).toLowerCase();
      const base=wanted.split('-')[0];
      const matching=all.filter(v=>v.lang.toLowerCase().startsWith(base));
      setVoices(matching.length?matching:all);
      if(!voiceUri){const preferred=matching.find(v=>v.lang.toLowerCase()===wanted)||matching[0];if(preferred)setVoiceUri(preferred.voiceURI);}
    };
    load();window.speechSynthesis.onvoiceschanged=load;
    return()=>{window.speechSynthesis.cancel();window.speechSynthesis.onvoiceschanged=null;};
  },[locale,voiceUri]);

  function speakNext(){
    if(!activeRef.current)return;
    if(indexRef.current>=queueRef.current.length){activeRef.current=false;setSpeaking(false);setPaused(false);return;}
    const utterance=new SpeechSynthesisUtterance(queueRef.current[indexRef.current]);
    utterance.lang=localeVoice[locale]||locale;
    utterance.rate=rate;
    const selected=voices.find(v=>v.voiceURI===voiceUri);if(selected)utterance.voice=selected;
    utterance.onend=()=>{indexRef.current+=1;speakNext();};
    utterance.onerror=()=>{indexRef.current+=1;speakNext();};
    window.speechSynthesis.speak(utterance);
  }

  function start(){
    if(!supported||!chunks.length)return;
    window.speechSynthesis.cancel();queueRef.current=chunks;indexRef.current=0;activeRef.current=true;setSpeaking(true);setPaused(false);speakNext();
  }
  function togglePause(){
    if(!speaking)return start();
    if(window.speechSynthesis.paused){window.speechSynthesis.resume();setPaused(false);}else{window.speechSynthesis.pause();setPaused(true);}
  }
  function stop(){window.speechSynthesis.cancel();activeRef.current=false;indexRef.current=0;setSpeaking(false);setPaused(false);}
  function restart(){stop();setTimeout(start,40);}

  if(!supported)return <div className="browserReader unsupported"><p>Trình duyệt này chưa hỗ trợ đọc văn bản bằng giọng nói.</p></div>;
  return <div className="browserReader">
    <div className="ttsPrimary">
      {!speaking?<button className="ttsMain" onClick={start}><Play size={18} fill="currentColor"/>Nghe toàn văn</button>:<button className="ttsMain" onClick={togglePause}>{paused?<Play size={18}/>:<Pause size={18}/>} {paused?'Đọc tiếp':'Tạm dừng'}</button>}
      <button className="ttsIcon" onClick={stop} aria-label="Dừng đọc"><Square size={17}/></button>
      <button className="ttsIcon" onClick={restart} aria-label="Đọc lại"><RotateCcw size={17}/></button>
    </div>
    <div className="ttsSettings">
      <label><Volume2 size={15}/><span>Giọng</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}>{voices.slice(0,12).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}</select></label>
      <label><span>Tốc độ</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[0.75,0.9,1,1.15,1.25,1.5,1.75,2].map(v=><option value={v} key={v}>{v}×</option>)}</select></label>
    </div>
    <p className="ttsNote">Đọc trực tiếp từ nội dung trên trang bằng công cụ giọng nói của trình duyệt/thiết bị, không phụ thuộc file MP3 bên ngoài.</p>
  </div>;
}
