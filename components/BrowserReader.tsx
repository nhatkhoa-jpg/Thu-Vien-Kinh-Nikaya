'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,Pause,Play,RefreshCw,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar-SA',fr:'fr-FR',bn:'bn-BD',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur-PK',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
const libraryVoice:Record<string,string>={vi:'vi',en:'en-us',zh:'zh',hi:'hi',es:'es',ar:'ar',fr:'fr',bn:'bn',pt:'pt',ru:'ru',id:'id',ur:'ur',de:'de',ja:'ja',ko:'ko',th:'th'};
type ReaderState='idle'|'loading'|'speaking'|'paused'|'error';
type Engine='auto'|'device'|'internal';
type ActiveEngine='device'|'library'|'server'|null;

let libraryTtsPromise:Promise<any>|null=null;

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
    'internal-tts-failed':['Giọng thư viện chưa tạo được âm thanh.','Library speech engine failed.'],
    'library-engine-unavailable':['Không tải được bộ giọng của thư viện.','The library speech engine could not load.'],
    'synthesis-unavailable':['Máy chưa có bộ máy chuyển văn bản thành giọng nói.','No speech synthesis engine is available on this device.'],
    'language-unavailable':['Máy chưa có giọng phù hợp với ngôn ngữ này.','No voice is available for this language.'],
    'voice-unavailable':['Giọng đã chọn hiện không khả dụng.','The selected voice is unavailable.'],
    'not-allowed':['Trình duyệt chưa cho phép bắt đầu phát giọng nói. Hãy bấm Thử lại.','The browser did not allow speech to start. Tap Retry.'],
    'synthesis-failed':['Bộ máy giọng nói trên thiết bị không phản hồi.','The device speech engine failed to respond.']
  };
  return (map[code]||[vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`,vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`])[vi?0:1];
}

function loadLibraryTts(){
  if(typeof window==='undefined')return Promise.reject(new Error('browser-only'));
  if(libraryTtsPromise)return libraryTtsPromise;
  libraryTtsPromise=new Promise<any>((resolve,reject)=>{
    const boot=()=>{
      const Ctor=(window as any).eSpeakNG;
      if(!Ctor){reject(new Error('espeak-constructor-missing'));return;}
      let settled=false;
      const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('espeak-worker-timeout'));}},25000);
      try{
        const instance=new Ctor('/api/tts-assets/espeakng.worker.js',()=>{
          if(settled)return;
          settled=true;clearTimeout(timer);resolve(instance);
        });
      }catch(error){clearTimeout(timer);reject(error);}
    };
    if((window as any).eSpeakNG){boot();return;}
    const id='nikaya-espeakng-script';
    const existing=document.getElementById(id) as HTMLScriptElement|null;
    if(existing){
      if(existing.dataset.ready==='1'){boot();return;}
      existing.addEventListener('load',boot,{once:true});
      existing.addEventListener('error',()=>reject(new Error('espeak-script-load-failed')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.id=id;script.async=true;script.src='/api/tts-assets/espeakng.js';
    script.onload=()=>{script.dataset.ready='1';boot();};
    script.onerror=()=>reject(new Error('espeak-script-load-failed'));
    document.head.appendChild(script);
  }).catch(error=>{libraryTtsPromise=null;throw error;});
  return libraryTtsPromise;
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const vi=locale==='vi';
  const deviceChunks=useMemo(()=>chunkText(text,210),[text]);
  const internalChunks=useMemo(()=>chunkText(text,360),[text]);
  const [supported,setSupported]=useState(true);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [engine,setEngine]=useState<Engine>('auto');
  const [activeEngine,setActiveEngine]=useState<ActiveEngine>(null);
  const [state,setState]=useState<ReaderState>('idle');
  const [message,setMessage]=useState('');
  const queueRef=useRef<string[]>([]);
  const indexRef=useRef(0);
  const activeRef=useRef(false);
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const audioUrlRef=useRef<string>('');
  const libraryContextRef=useRef<AudioContext|null>(null);
  const libraryNodeRef=useRef<ScriptProcessorNode|null>(null);
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

  function clearLibraryAudio(){
    if(libraryNodeRef.current){try{libraryNodeRef.current.disconnect();}catch{}libraryNodeRef.current.onaudioprocess=null;libraryNodeRef.current=null;}
    if(libraryContextRef.current){void libraryContextRef.current.close().catch(()=>{});libraryContextRef.current=null;}
  }

  function clearAudio(){
    clearLibraryAudio();
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

  function unlockAudio(){
    try{
      const Ctx=(window.AudioContext||(window as any).webkitAudioContext) as typeof AudioContext|undefined;
      if(!Ctx)return;
      const ctx=new Ctx();
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      gain.gain.value=.00001;
      osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.02);
      osc.onended=()=>void ctx.close();
    }catch{}
  }

  async function speakServerInternal(){
    if(!activeRef.current)return;
    setActiveEngine('server');setState('loading');setMessage(vi?'Đang dùng giọng dự phòng của máy chủ…':'Using server speech fallback…');
    try{
      const response=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:queueRef.current[indexRef.current],locale,rate})});
      if(!response.ok)throw new Error('internal-tts-failed');
      const blob=await response.blob();
      if(!activeRef.current)return;
      clearAudio();
      const url=URL.createObjectURL(blob);audioUrlRef.current=url;
      const audio=new Audio(url);audioRef.current=audio;
      audio.preload='auto';
      audio.onplay=()=>{setState('speaking');setMessage(vi?'Đang đọc bằng giọng dự phòng của thư viện.':'Reading with the library server fallback.');};
      audio.onended=()=>{clearAudio();if(!activeRef.current)return;indexRef.current+=1;void speakInternal();};
      audio.onerror=()=>fail('internal-tts-failed');
      await audio.play();
    }catch{fail('internal-tts-failed');}
  }

  async function speakBrowserLibrary(){
    if(!activeRef.current)return;
    if(indexRef.current>=queueRef.current.length){finish();return;}
    setActiveEngine('library');setState('loading');setMessage(vi?'Đang tải giọng thư viện…':'Loading library voice…');
    try{
      const tts=await loadLibraryTts();
      if(!activeRef.current)return;
      const Ctx=(window.AudioContext||(window as any).webkitAudioContext) as typeof AudioContext|undefined;
      if(!Ctx)throw new Error('audio-context-unavailable');
      clearLibraryAudio();
      const ctx=new Ctx();libraryContextRef.current=ctx;await ctx.resume();
      const node=ctx.createScriptProcessor(4096,1,1);libraryNodeRef.current=node;
      const samplesQueue:Float32Array[]=[];
      let closed=false;let first=false;let completed=false;
      const endChunk=()=>{
        if(completed)return;completed=true;
        clearLibraryAudio();
        if(!activeRef.current)return;
        indexRef.current+=1;
        void speakInternal();
      };
      node.onaudioprocess=event=>{
        const output=event.outputBuffer.getChannelData(0);output.fill(0);
        let offset=0;
        while(samplesQueue.length&&offset<output.length){
          const head=samplesQueue[0];
          const count=Math.min(head.length,output.length-offset);
          output.set(head.subarray(0,count),offset);offset+=count;
          if(count===head.length)samplesQueue.shift();else samplesQueue[0]=head.subarray(count);
        }
        if(closed&&!samplesQueue.length)endChunk();
      };
      node.connect(ctx.destination);
      if(watchdogRef.current)clearTimeout(watchdogRef.current);
      watchdogRef.current=setTimeout(()=>{
        if(activeRef.current&&!first){clearLibraryAudio();void speakServerInternal();}
      },18000);
      tts.set_rate(Math.round(175*rate));
      tts.set_pitch(48);
      tts.set_voice(libraryVoice[locale]||locale.split('-')[0]||'en-us');
      tts.synthesize(queueRef.current[indexRef.current],(samples:any)=>{
        if(!activeRef.current)return;
        if(!samples){closed=true;return;}
        const chunk=new Float32Array(samples);
        if(!chunk.length)return;
        if(!first){
          first=true;
          if(watchdogRef.current){clearTimeout(watchdogRef.current);watchdogRef.current=null;}
          setState('speaking');setMessage(vi?'Đang đọc bằng giọng của thư viện.':'Reading with the library voice.');
        }
        samplesQueue.push(chunk);
      });
    }catch{
      if(activeRef.current)void speakServerInternal();
    }
  }

  async function speakInternal(){
    if(!activeRef.current)return;
    if(indexRef.current>=queueRef.current.length){finish();return;}
    await speakBrowserLibrary();
  }

  function speakDevice(){
    if(!activeRef.current)return;
    if(!supported||!('speechSynthesis' in window)){fail('synthesis-unavailable');return;}
    if(indexRef.current>=queueRef.current.length){finish();return;}
    const synth=window.speechSynthesis;
    const liveVoices=synth.getVoices();
    if(!liveVoices.length){fail('synthesis-unavailable');return;}
    setActiveEngine('device');setState('loading');setMessage(vi?'Đang khởi động giọng thiết bị…':'Starting device voice…');
    const utterance=new SpeechSynthesisUtterance(queueRef.current[indexRef.current]);
    utterance.lang=localeVoice[locale]||locale;utterance.rate=rate;utterance.pitch=1;utterance.volume=1;
    const selected=liveVoices.find(v=>v.voiceURI===voiceUri)||liveVoices.find(v=>v.lang.toLowerCase().startsWith(locale.split('-')[0]))||liveVoices.find(v=>v.default)||liveVoices[0];
    if(selected)utterance.voice=selected;
    utteranceRef.current=utterance;
    let started=false;
    utterance.onstart=()=>{started=true;if(watchdogRef.current)clearTimeout(watchdogRef.current);setState('speaking');setMessage(vi?`Đang đọc bằng ${selected?.name||'giọng thiết bị'}.`:`Reading with ${selected?.name||'device voice'}.`);};
    utterance.onend=()=>{if(!activeRef.current)return;indexRef.current+=1;setTimeout(speakDevice,30);};
    utterance.onerror=(event:any)=>{if(!activeRef.current||event?.error==='canceled'||event?.error==='interrupted')return;fail(event?.error||'synthesis-failed');};
    synth.cancel();synth.resume();synth.speak(utterance);
    if(watchdogRef.current)clearTimeout(watchdogRef.current);
    watchdogRef.current=setTimeout(()=>{if(activeRef.current&&!started)fail('synthesis-unavailable');},1800);
  }

  function start(){
    if(!deviceChunks.length&&!internalChunks.length)return;
    unlockAudio();
    stopAll(false);
    indexRef.current=0;activeRef.current=true;setState('loading');
    const choice:Engine=engine==='auto'?'internal':engine;
    queueRef.current=choice==='internal'?internalChunks:deviceChunks;
    if(choice==='device')speakDevice();else void speakInternal();
  }

  function togglePause(){
    if(state==='paused'){
      if(activeEngine==='library'&&libraryContextRef.current){void libraryContextRef.current.resume();}
      else if(activeEngine==='server'&&audioRef.current){void audioRef.current.play();}
      else if('speechSynthesis' in window)window.speechSynthesis.resume();
      setState('speaking');return;
    }
    if(state==='speaking'||state==='loading'){
      if(activeEngine==='library'&&libraryContextRef.current){void libraryContextRef.current.suspend();}
      else if(activeEngine==='server'&&audioRef.current)audioRef.current.pause();
      else if('speechSynthesis' in window)window.speechSynthesis.pause();
      setState('paused');return;
    }
    start();
  }
  function restart(){stopAll(false);setTimeout(start,100);}
  function retry(){setMessage('');start();}

  const active=state==='loading'||state==='speaking'||state==='paused';
  return <div className="browserReader compactTts">
    <div className="ttsPrimary">
      {!active?<button className="ttsMain" onClick={start}><Play size={17} fill="currentColor"/>{vi?'Nghe':'Listen'}</button>:<button className="ttsMain" onClick={togglePause}>{state==='paused'?<Play size={17}/>:<Pause size={17}/>} {state==='paused'?(vi?'Đọc tiếp':'Resume'):(state==='loading'?(vi?'Đang chuẩn bị…':'Preparing…'):(vi?'Tạm dừng':'Pause'))}</button>}
      <button className="ttsIcon" onClick={()=>stopAll(true)} title={vi?'Dừng':'Stop'}><Square size={16}/></button>
      <button className="ttsIcon" onClick={restart} title={vi?'Đọc lại':'Restart'}><RotateCcw size={16}/></button>
    </div>
    <div className="ttsSettings compactSettings">
      <label><Volume2 size={14}/><span>{vi?'Nguồn':'Engine'}</span><select value={engine} onChange={e=>setEngine(e.target.value as Engine)}><option value="auto">{vi?'Tự động · giọng thư viện':'Auto · library voice'}</option><option value="internal">{vi?'Giọng thư viện':'Library voice'}</option><option value="device">{vi?'Giọng thiết bị':'Device voice'}</option></select></label>
      <label><span>{vi?'Tốc độ':'Speed'}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[0.75,0.9,1,1.15,1.25,1.5,1.75,2].map(v=><option value={v} key={v}>{v}×</option>)}</select></label>
    </div>
    {engine==='device'&&voices.length>0&&<label className="voicePicker"><span>{vi?'Giọng thiết bị':'Device voice'}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}>{voices.slice(0,16).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}
    {message&&<div className={`ttsStatus ${state==='error'?'ttsStatusError':''}`}>{state==='error'?<AlertCircle size={14}/>:<Volume2 size={14}/>}<span>{message}</span>{state==='error'&&<button onClick={retry}><RefreshCw size={13}/>{vi?'Thử lại':'Retry'}</button>}</div>}
    <p className="ttsNote">{vi?'Tự động dùng giọng WebAssembly của thư viện trên mọi thiết bị; giọng hệ thống chỉ là lựa chọn thêm.':'Auto uses the library WebAssembly voice on every device; device speech is optional.'}</p>
  </div>;
}
