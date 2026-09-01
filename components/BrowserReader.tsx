'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,Pause,Play,RefreshCw,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar-SA',fr:'fr-FR',bn:'bn-BD',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur-PK',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
type ReaderState='idle'|'loading'|'speaking'|'paused'|'error';

function chunkText(text:string,max=220){
  const normalized=text.normalize('NFC').replace(/\s+/g,' ').trim();
  if(!normalized)return[];
  const sentences=normalized.split(/(?<=[.!?。！？])\s+/);
  const out:string[]=[];
  for(const sentence of sentences){
    let rest=sentence.trim();
    while(rest.length>max){
      let cut=rest.lastIndexOf(',',max);
      if(cut<Math.floor(max*.55))cut=rest.lastIndexOf(';',max);
      if(cut<Math.floor(max*.55))cut=rest.lastIndexOf(' ',max);
      if(cut<Math.floor(max*.55))cut=max;
      out.push(rest.slice(0,cut+1).trim());
      rest=rest.slice(cut+1).trim();
    }
    if(rest)out.push(rest);
  }
  return out;
}

function readableError(code:string,vi:boolean){
  const map:Record<string,[string,string]>={
    'synthesis-unavailable':['Máy chưa có bộ máy chuyển văn bản thành giọng nói.','No speech synthesis engine is available on this device.'],
    'language-unavailable':['Máy chưa có giọng phù hợp với ngôn ngữ này.','No voice is available for this language.'],
    'voice-unavailable':['Giọng đã chọn hiện không khả dụng.','The selected voice is unavailable.'],
    'not-allowed':['Chrome chưa cho phép bắt đầu phát giọng nói. Hãy bấm Thử lại.','Chrome did not allow speech to start. Tap Retry.'],
    'text-too-long':['Đoạn đọc quá dài đối với bộ máy TTS.','The speech engine rejected a long text chunk.'],
    'synthesis-failed':['Bộ máy giọng nói trên thiết bị không phản hồi.','The device speech engine failed to respond.']
  };
  return (map[code]||[vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`,vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`])[vi?0:1];
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const vi=locale==='vi';
  const chunks=useMemo(()=>chunkText(text),[text]);
  const [supported,setSupported]=useState(true);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [allVoiceCount,setAllVoiceCount]=useState(0);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [state,setState]=useState<ReaderState>('idle');
  const [message,setMessage]=useState('');
  const queueRef=useRef<string[]>([]);
  const indexRef=useRef(0);
  const activeRef=useRef(false);
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const watchdogRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const startTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const keepAliveRef=useRef<ReturnType<typeof setInterval>|null>(null);

  useEffect(()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setSupported(false);return;}
    const synth=window.speechSynthesis;
    const load=()=>{
      const all=synth.getVoices();
      const wanted=(localeVoice[locale]||locale).toLowerCase().replace('_','-');
      const base=wanted.split('-')[0];
      const matching=all.filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(base));
      const shown=matching.length?matching:all;
      setAllVoiceCount(all.length);
      setVoices(shown);
      setVoiceUri(current=>{
        if(current&&shown.some(v=>v.voiceURI===current))return current;
        const preferred=matching.find(v=>v.lang.toLowerCase().replace('_','-')===wanted)||matching[0]||all.find(v=>v.default)||all[0];
        return preferred?.voiceURI||'';
      });
    };
    load();
    const timers=[180,650,1500,3000].map(ms=>setTimeout(load,ms));
    synth.addEventListener?.('voiceschanged',load);
    return()=>{
      timers.forEach(clearTimeout);
      synth.removeEventListener?.('voiceschanged',load);
      synth.cancel();
      if(watchdogRef.current)clearTimeout(watchdogRef.current);
      if(startTimerRef.current)clearTimeout(startTimerRef.current);
      if(keepAliveRef.current)clearInterval(keepAliveRef.current);
    };
  },[locale]);

  function finish(){
    activeRef.current=false;
    utteranceRef.current=null;
    setState('idle');
    setMessage(vi?'Đã đọc xong.':'Finished.');
    if(keepAliveRef.current){clearInterval(keepAliveRef.current);keepAliveRef.current=null;}
  }

  function fail(code:string){
    activeRef.current=false;
    utteranceRef.current=null;
    setState('error');
    setMessage(readableError(code,vi));
    if(keepAliveRef.current){clearInterval(keepAliveRef.current);keepAliveRef.current=null;}
  }

  function speakNext(){
    if(!activeRef.current)return;
    const synth=window.speechSynthesis;
    if(indexRef.current>=queueRef.current.length){finish();return;}
    const utterance=new SpeechSynthesisUtterance(queueRef.current[indexRef.current]);
    utterance.lang=localeVoice[locale]||locale;
    utterance.rate=rate;
    utterance.pitch=1;
    utterance.volume=1;
    const liveVoices=synth.getVoices();
    const selected=liveVoices.find(v=>v.voiceURI===voiceUri);
    if(selected)utterance.voice=selected;
    utteranceRef.current=utterance;
    let started=false;
    utterance.onstart=()=>{
      started=true;
      if(watchdogRef.current)clearTimeout(watchdogRef.current);
      setState('speaking');
      setMessage(selected?(vi?`Đang đọc bằng ${selected.name}`:`Reading with ${selected.name}`):(vi?'Đang đọc bằng giọng mặc định của thiết bị.':'Reading with the device default voice.'));
    };
    utterance.onend=()=>{
      if(!activeRef.current)return;
      indexRef.current+=1;
      setTimeout(speakNext,45);
    };
    utterance.onerror=(event:any)=>{
      if(!activeRef.current||event?.error==='canceled'||event?.error==='interrupted')return;
      fail(event?.error||'synthesis-failed');
    };
    synth.speak(utterance);
    if(watchdogRef.current)clearTimeout(watchdogRef.current);
    watchdogRef.current=setTimeout(()=>{
      if(activeRef.current&&!started&&!synth.speaking){synth.cancel();fail('synthesis-unavailable');}
    },2600);
  }

  function start(){
    if(!supported||!chunks.length)return;
    const synth=window.speechSynthesis;
    synth.cancel();
    synth.resume();
    queueRef.current=chunks;
    indexRef.current=0;
    activeRef.current=true;
    setState('loading');
    setMessage(vi?'Đang khởi động giọng đọc…':'Starting speech…');
    if(startTimerRef.current)clearTimeout(startTimerRef.current);
    startTimerRef.current=setTimeout(()=>{if(activeRef.current)speakNext();},120);
    if(keepAliveRef.current)clearInterval(keepAliveRef.current);
    keepAliveRef.current=setInterval(()=>{
      if(activeRef.current&&state!=='paused'&&!window.speechSynthesis.paused)window.speechSynthesis.resume();
    },9000);
  }

  function togglePause(){
    const synth=window.speechSynthesis;
    if(state==='paused'){synth.resume();setState('speaking');setMessage(vi?'Đang đọc tiếp…':'Resumed.');return;}
    if(state==='speaking'||state==='loading'){synth.pause();setState('paused');setMessage(vi?'Đã tạm dừng.':'Paused.');return;}
    start();
  }

  function stop(){
    if(startTimerRef.current)clearTimeout(startTimerRef.current);
    if(watchdogRef.current)clearTimeout(watchdogRef.current);
    window.speechSynthesis.cancel();
    activeRef.current=false;
    indexRef.current=0;
    utteranceRef.current=null;
    setState('idle');
    setMessage(vi?'Đã dừng.':'Stopped.');
    if(keepAliveRef.current){clearInterval(keepAliveRef.current);keepAliveRef.current=null;}
  }
  function restart(){stop();setTimeout(start,160);}
  function retry(){
    const synth=window.speechSynthesis;
    const all=synth.getVoices();
    setAllVoiceCount(all.length);
    setMessage('');
    start();
  }

  if(!supported)return <div className="browserReader unsupported"><p>{vi?'Trình duyệt này chưa hỗ trợ Web Speech API.':'This browser does not support Web Speech API.'}</p></div>;
  const active=state==='loading'||state==='speaking'||state==='paused';
  const noVoices=allVoiceCount===0;

  return <div className="browserReader">
    <div className="ttsPrimary">
      {!active?<button className="ttsMain" onClick={start}><Play size={18} fill="currentColor"/>{vi?'Nghe toàn văn':'Listen to full text'}</button>:<button className="ttsMain" onClick={togglePause}>{state==='paused'?<Play size={18}/>:<Pause size={18}/>} {state==='paused'?(vi?'Đọc tiếp':'Resume'):(state==='loading'?(vi?'Đang khởi động…':'Starting…'):(vi?'Tạm dừng':'Pause'))}</button>}
      <button className="ttsIcon" onClick={stop} aria-label={vi?'Dừng đọc':'Stop'}><Square size={17}/></button>
      <button className="ttsIcon" onClick={restart} aria-label={vi?'Đọc lại':'Restart'}><RotateCcw size={17}/></button>
    </div>
    <div className="ttsSettings">
      <label><Volume2 size={15}/><span>{vi?'Giọng':'Voice'}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}><option value="">{vi?'Tự động · giọng hệ thống':'Auto · system voice'}</option>{voices.slice(0,16).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>
      <label><span>{vi?'Tốc độ':'Speed'}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[0.75,0.9,1,1.15,1.25,1.5,1.75,2].map(v=><option value={v} key={v}>{v}×</option>)}</select></label>
    </div>
    {message&&<div className={`ttsStatus ${state==='error'?'ttsStatusError':''}`}>{state==='error'?<AlertCircle size={15}/>:<Volume2 size={15}/>}<span>{message}</span>{state==='error'&&<button onClick={retry}><RefreshCw size={14}/>{vi?'Thử lại':'Retry'}</button>}</div>}
    {noVoices&&<div className="ttsWarning"><AlertCircle size={15}/><p>{vi?'Chrome chưa trả danh sách giọng của máy. Website vẫn thử giọng mặc định; nếu vẫn im lặng, trên Android hãy dùng ⋮ → “Nghe trang này” hoặc cài/chọn bộ máy Chuyển văn bản thành giọng nói trong hệ thống.':'Chrome has not exposed any device voices. The site will still try the system default voice.'}</p></div>}
    <p className="ttsNote">{vi?'Đọc trực tiếp từ toàn văn đang mở. Trạng thái “Đang đọc” chỉ xuất hiện sau khi bộ máy TTS thực sự bắt đầu phát.':'Reads the current full text and only reports speaking after the speech engine actually starts.'}</p>
  </div>;
}
