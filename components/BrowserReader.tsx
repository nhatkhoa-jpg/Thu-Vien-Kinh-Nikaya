'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,Pause,Play,RefreshCw,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar-SA',fr:'fr-FR',bn:'bn-BD',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur-PK',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
type ReaderState='idle'|'loading'|'speaking'|'paused'|'error';
type Engine='auto'|'device'|'internal';

function chunkText(text:string,max=210){
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
    'internal-tts-failed':['Giọng nội bộ chưa tạo được âm thanh.','Internal speech fallback failed.'],
    'synthesis-unavailable':['Máy chưa có bộ máy chuyển văn bản thành giọng nói.','No speech synthesis engine is available on this device.'],
    'language-unavailable':['Máy chưa có giọng phù hợp với ngôn ngữ này.','No voice is available for this language.'],
    'voice-unavailable':['Giọng đã chọn hiện không khả dụng.','The selected voice is unavailable.'],
    'not-allowed':['Chrome chưa cho phép bắt đầu phát giọng nói. Hãy bấm Thử lại.','Chrome did not allow speech to start. Tap Retry.'],
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
  const [engine,setEngine]=useState<Engine>('auto');
  const [activeEngine,setActiveEngine]=useState<'device'|'internal'|null>(null);
  const [state,setState]=useState<ReaderState>('idle');
  const [message,setMessage]=useState('');
  const queueRef=useRef<string[]>([]);
  const indexRef=useRef(0);
  const activeRef=useRef(false);
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const audioUrlRef=useRef<string>('');
  const watchdogRef=useRef<ReturnType<typeof setTimeout>|null>(null);

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
      stopAll(false);
    };
  },[locale]);

  function clearAudio(){
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';audioRef.current=null;}
    if(audioUrlRef.current){URL.revokeObjectURL(audioUrlRef.current);audioUrlRef.current='';}
  }

  function stopAll(update=true){
    if(watchdogRef.current){clearTimeout(watchdogRef.current);watchdogRef.current=null;}
    if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
    clearAudio();
    activeRef.current=false;
    utteranceRef.current=null;
    indexRef.current=0;
    setActiveEngine(null);
    if(update){setState('idle');setMessage(vi?'Đã dừng.':'Stopped.');}
  }

  function finish(){
    activeRef.current=false;utteranceRef.current=null;clearAudio();setActiveEngine(null);setState('idle');setMessage(vi?'Đã đọc xong.':'Finished.');
  }
  function fail(code:string){
    activeRef.current=false;utteranceRef.current=null;clearAudio();setActiveEngine(null);setState('error');setMessage(readableError(code,vi));
  }

  async function speakInternal(){
    if(!activeRef.current)return;
    if(indexRef.current>=queueRef.current.length){finish();return;}
    setActiveEngine('internal');setState('loading');setMessage(vi?'Đang tạo giọng nội bộ…':'Generating internal speech…');
    try{
      const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:queueRef.current[indexRef.current],locale,rate})});
      if(!response.ok)throw new Error('internal-tts-failed');
      const blob=await response.blob();
      if(!activeRef.current)return;
      clearAudio();
      const url=URL.createObjectURL(blob);audioUrlRef.current=url;
      const audio=new Audio(url);audioRef.current=audio;
      audio.preload='auto';
      audio.onplay=()=>{setState('speaking');setMessage(vi?'Đang đọc bằng giọng nội bộ của thư viện.':'Reading with the library internal voice.');};
      audio.onended=()=>{clearAudio();if(!activeRef.current)return;indexRef.current+=1;void speakInternal();};
      audio.onerror=()=>fail('internal-tts-failed');
      await audio.play();
    }catch{fail('internal-tts-failed');}
  }

  function fallbackToInternal(){
    if(!activeRef.current)return;
    window.speechSynthesis.cancel();
    utteranceRef.current=null;
    setMessage(vi?'Giọng hệ thống im lặng — chuyển sang giọng nội bộ…':'Device voice unavailable — switching to internal voice…');
    void speakInternal();
  }

  function speakDevice(){
    if(!activeRef.current)return;
    if(indexRef.current>=queueRef.current.length){finish();return;}
    const synth=window.speechSynthesis;
    const liveVoices=synth.getVoices();
    if(!liveVoices.length){fallbackToInternal();return;}
    setActiveEngine('device');setState('loading');setMessage(vi?'Đang khởi động giọng thiết bị…':'Starting device voice…');
    const utterance=new SpeechSynthesisUtterance(queueRef.current[indexRef.current]);
    utterance.lang=localeVoice[locale]||locale;utterance.rate=rate;utterance.pitch=1;utterance.volume=1;
    const selected=liveVoices.find(v=>v.voiceURI===voiceUri)||liveVoices.find(v=>v.lang.toLowerCase().startsWith(locale.split('-')[0]))||liveVoices.find(v=>v.default)||liveVoices[0];
    if(selected)utterance.voice=selected;
    utteranceRef.current=utterance;
    let started=false;
    utterance.onstart=()=>{started=true;if(watchdogRef.current)clearTimeout(watchdogRef.current);setState('speaking');setMessage(vi?`Đang đọc bằng ${selected?.name||'giọng thiết bị'}.`:`Reading with ${selected?.name||'device voice'}.`);};
    utterance.onend=()=>{if(!activeRef.current)return;indexRef.current+=1;setTimeout(speakDevice,30);};
    utterance.onerror=(event:any)=>{if(!activeRef.current||event?.error==='canceled'||event?.error==='interrupted')return;if(engine==='device')fail(event?.error||'synthesis-failed');else fallbackToInternal();};
    synth.cancel();synth.resume();synth.speak(utterance);
    if(watchdogRef.current)clearTimeout(watchdogRef.current);
    watchdogRef.current=setTimeout(()=>{if(activeRef.current&&!started){engine==='device'?fail('synthesis-unavailable'):fallbackToInternal();}},2300);
  }

  function start(){
    if(!chunks.length)return;
    stopAll(false);
    queueRef.current=chunks;indexRef.current=0;activeRef.current=true;setState('loading');
    const choice:Engine=engine==='auto'?(supported&&allVoiceCount>0?'device':'internal'):engine;
    if(choice==='device')speakDevice();else void speakInternal();
  }

  function togglePause(){
    if(state==='paused'){
      if(activeEngine==='internal'&&audioRef.current){void audioRef.current.play();}
      else window.speechSynthesis.resume();
      setState('speaking');return;
    }
    if(state==='speaking'||state==='loading'){
      if(activeEngine==='internal'&&audioRef.current)audioRef.current.pause();
      else window.speechSynthesis.pause();
      setState('paused');return;
    }
    start();
  }
  function restart(){stopAll(false);setTimeout(start,100);}
  function retry(){setMessage('');start();}

  const active=state==='loading'||state==='speaking'||state==='paused';
  return <div className="browserReader compactTts">
    <div className="ttsPrimary">
      {!active?<button className="ttsMain" onClick={start}><Play size={17} fill="currentColor"/>{vi?'Nghe toàn văn':'Listen'}</button>:<button className="ttsMain" onClick={togglePause}>{state==='paused'?<Play size={17}/>:<Pause size={17}/>} {state==='paused'?(vi?'Đọc tiếp':'Resume'):(state==='loading'?(vi?'Đang chuẩn bị…':'Preparing…'):(vi?'Tạm dừng':'Pause'))}</button>}
      <button className="ttsIcon" onClick={()=>stopAll(true)} title={vi?'Dừng':'Stop'}><Square size={16}/></button>
      <button className="ttsIcon" onClick={restart} title={vi?'Đọc lại':'Restart'}><RotateCcw size={16}/></button>
    </div>
    <div className="ttsSettings compactSettings">
      <label><Volume2 size={14}/><span>{vi?'Nguồn giọng':'Engine'}</span><select value={engine} onChange={e=>setEngine(e.target.value as Engine)}><option value="auto">{vi?'Tự động':'Auto'}</option><option value="device">{vi?'Giọng thiết bị':'Device'}</option><option value="internal">{vi?'Giọng nội bộ':'Internal'}</option></select></label>
      <label><span>{vi?'Tốc độ':'Speed'}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[0.75,0.9,1,1.15,1.25,1.5,1.75,2].map(v=><option value={v} key={v}>{v}×</option>)}</select></label>
    </div>
    {engine!=='internal'&&voices.length>0&&<label className="voicePicker"><span>{vi?'Giọng thiết bị':'Device voice'}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}>{voices.slice(0,16).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}
    {message&&<div className={`ttsStatus ${state==='error'?'ttsStatusError':''}`}>{state==='error'?<AlertCircle size={14}/>:<Volume2 size={14}/>}<span>{message}</span>{state==='error'&&<button onClick={retry}><RefreshCw size={13}/>{vi?'Thử lại':'Retry'}</button>}</div>}
    {!supported||allVoiceCount===0?<p className="ttsNote">{vi?'Máy không có giọng hệ thống khả dụng: chế độ Tự động sẽ dùng giọng nội bộ của thư viện, không cần MP3 ngoài.':'No usable device voice: Auto uses the library internal voice without external MP3.'}</p>:<p className="ttsNote">{vi?'Tự động ưu tiên giọng thiết bị; nếu thất bại sẽ chuyển sang giọng nội bộ.':'Auto prefers the device voice and falls back to the internal voice.'}</p>}
  </div>;
}
