'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertCircle,Pause,Play,RefreshCw,RotateCcw,Square,Volume2} from 'lucide-react';
import {decodeWavDuration,piperVoiceForLocale,synthesizePiper} from '@/lib/piperClient';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar-SA',fr:'fr-FR',bn:'bn-BD',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur-PK',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
type ReaderState='idle'|'loading'|'speaking'|'paused'|'error';
type Engine='auto'|'library'|'device';
type ActiveEngine='library'|'device'|null;
type Prefetch={index:number;promise:Promise<Blob>}|null;

function prepareSpeechText(text:string,vi:boolean){
  let value=text.normalize('NFC')
    .replace(/\u00a0/g,' ')
    .replace(/[–—]/g,', ')
    .replace(/\s+/g,' ')
    .trim();
  if(vi){
    value=value
      .replace(/\bSC\s*(\d+)\b/gi,'Đoạn $1.')
      .replace(/\bTB\s*(\d+)\b/g,'Trung Bộ $1')
      .replace(/\bMN\s*(\d+)\b/gi,'M N $1');
  }
  return value;
}

function chunkText(text:string,max=420,vi=false){
  const normalized=prepareSpeechText(text,vi);
  if(!normalized)return[];
  const sentences=normalized.split(/(?<=[.!?。！？])\s+/);
  const out:string[]=[];
  let current='';
  for(const raw of sentences){
    const sentence=raw.trim();
    if(!sentence)continue;
    if((current+' '+sentence).trim().length<=max){current=(current+' '+sentence).trim();continue;}
    if(current)out.push(current);
    if(sentence.length<=max){current=sentence;continue;}
    let rest=sentence;
    while(rest.length>max){
      let cut=rest.lastIndexOf(',',max);
      if(cut<Math.floor(max*.55))cut=rest.lastIndexOf(';',max);
      if(cut<Math.floor(max*.55))cut=rest.lastIndexOf(' ',max);
      if(cut<Math.floor(max*.55))cut=max;
      out.push(rest.slice(0,cut+1).trim());
      rest=rest.slice(cut+1).trim();
    }
    current=rest;
  }
  if(current)out.push(current);
  return out;
}

function readableError(code:string,vi:boolean){
  const map:Record<string,[string,string]>={
    'library-language-unavailable':['Giọng thư viện chưa hỗ trợ ngôn ngữ này.','The library voice does not support this language yet.'],
    'library-tts-failed':['Giọng thư viện chưa tạo được âm thanh. Hãy thử lại.','The library voice could not generate audio. Please retry.'],
    'synthesis-unavailable':['Thiết bị không có giọng hệ thống phù hợp. Hãy dùng Giọng thư viện.','No matching device voice is available. Use Library voice.'],
    'not-allowed':['Trình duyệt chưa cho phép phát âm thanh. Hãy bấm Nghe lại.','The browser did not allow audio playback. Tap Listen again.']
  };
  return (map[code]||[vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`,vi?`Không phát được giọng đọc (${code}).`:`Speech failed (${code}).`])[vi?0:1];
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const vi=locale==='vi';
  const libraryChunks=useMemo(()=>chunkText(text,420,vi),[text,vi]);
  const deviceChunks=useMemo(()=>chunkText(text,240,vi),[text,vi]);
  const [supported,setSupported]=useState(true);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [engine,setEngine]=useState<Engine>('auto');
  const [activeEngine,setActiveEngine]=useState<ActiveEngine>(null);
  const [state,setState]=useState<ReaderState>('idle');
  const [message,setMessage]=useState('');
  const [progress,setProgress]=useState(0);
  const [diag,setDiag]=useState({bytes:0,duration:0});
  const queueRef=useRef<string[]>([]);
  const indexRef=useRef(0);
  const activeRef=useRef(false);
  const runRef=useRef(0);
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const audioUrlRef=useRef('');
  const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);
  const prefetchRef=useRef<Prefetch>(null);

  useEffect(()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setSupported(false);return;}
    const synth=window.speechSynthesis;
    const load=()=>{
      const all=synth.getVoices();
      const wanted=(localeVoice[locale]||locale).toLowerCase().replace('_','-');
      const base=wanted.split('-')[0];
      const matching=all.filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(base));
      setVoices(matching);
      setVoiceUri(current=>current&&matching.some(v=>v.voiceURI===current)?current:(matching[0]?.voiceURI||''));
    };
    load();
    const timers=[200,800,1800].map(ms=>setTimeout(load,ms));
    synth.addEventListener?.('voiceschanged',load);
    return()=>{timers.forEach(clearTimeout);synth.removeEventListener?.('voiceschanged',load);stopAll(false);};
  },[locale]);

  useEffect(()=>{
    if(audioRef.current){audioRef.current.playbackRate=rate;audioRef.current.preservesPitch=true;}
  },[rate]);

  function clearAudio(){
    if(audioRef.current){audioRef.current.pause();audioRef.current.src='';audioRef.current=null;}
    if(audioUrlRef.current){URL.revokeObjectURL(audioUrlRef.current);audioUrlRef.current='';}
  }

  function stopAll(update=true){
    runRef.current+=1;
    activeRef.current=false;
    prefetchRef.current=null;
    if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
    utteranceRef.current=null;
    clearAudio();
    indexRef.current=0;
    setActiveEngine(null);
    setProgress(0);
    if(update){setState('idle');setMessage(vi?'Đã dừng.':'Stopped.');}
  }

  function finish(){
    activeRef.current=false;prefetchRef.current=null;clearAudio();setActiveEngine(null);setState('idle');setMessage(vi?'Đã đọc xong.':'Finished.');
  }

  function fail(code:string){
    activeRef.current=false;prefetchRef.current=null;clearAudio();setActiveEngine(null);setState('error');setMessage(readableError(code,vi));
  }

  async function getLibraryBlob(index:number,run:number){
    if(prefetchRef.current?.index===index){
      const p=prefetchRef.current.promise;prefetchRef.current=null;return p;
    }
    return synthesizePiper(queueRef.current[index],locale,p=>{
      if(run!==runRef.current)return;
      setProgress(p.percent);
      if(p.total>20_000_000)setMessage(vi?`Lần đầu đang tải giọng Việt ${p.percent}%…`:`Downloading voice ${p.percent}%…`);
    });
  }

  async function playLibrary(index:number,run:number){
    if(!activeRef.current||run!==runRef.current)return;
    if(index>=queueRef.current.length){finish();return;}
    setActiveEngine('library');setState('loading');setProgress(0);
    setMessage(vi?'Đang chuẩn bị giọng Việt tự nhiên…':'Preparing neural library voice…');
    try{
      const blob=await getLibraryBlob(index,run);
      if(!activeRef.current||run!==runRef.current)return;
      const duration=await decodeWavDuration(blob).catch(()=>0);
      setDiag({bytes:blob.size,duration});
      clearAudio();
      const url=URL.createObjectURL(blob);audioUrlRef.current=url;
      const audio=new Audio(url);audioRef.current=audio;
      audio.preload='auto';audio.playbackRate=rate;audio.preservesPitch=true;
      audio.onplay=()=>{
        if(run!==runRef.current)return;
        setState('speaking');setMessage(vi?`Đang đọc bằng giọng thư viện · ${rate}×.`:`Reading with library voice · ${rate}×.`);
        const next=index+1;
        if(next<queueRef.current.length&&!prefetchRef.current){
          prefetchRef.current={index:next,promise:synthesizePiper(queueRef.current[next],locale)};
        }
      };
      audio.onended=()=>{if(!activeRef.current||run!==runRef.current)return;indexRef.current=index+1;void playLibrary(index+1,run);};
      audio.onerror=()=>{if(run===runRef.current)fail('library-tts-failed');};
      await audio.play();
    }catch(error:any){
      console.error('piper-library-tts-failed',error);
      if(run===runRef.current)fail(piperVoiceForLocale(locale)?'library-tts-failed':'library-language-unavailable');
    }
  }

  function speakDevice(index:number,run:number){
    if(!activeRef.current||run!==runRef.current)return;
    if(!supported||!('speechSynthesis' in window)||!voiceUri){fail('synthesis-unavailable');return;}
    if(index>=queueRef.current.length){finish();return;}
    const synth=window.speechSynthesis;
    const live=synth.getVoices();
    const selected=live.find(v=>v.voiceURI===voiceUri)||voices[0];
    if(!selected){fail('synthesis-unavailable');return;}
    setActiveEngine('device');setState('loading');
    const utterance=new SpeechSynthesisUtterance(queueRef.current[index]);
    utterance.lang=localeVoice[locale]||locale;utterance.voice=selected;utterance.rate=rate;utterance.pitch=1;utterance.volume=1;
    utteranceRef.current=utterance;
    utterance.onstart=()=>{if(run===runRef.current){setState('speaking');setMessage(vi?`Đang đọc bằng ${selected.name} · ${rate}×.`:`Reading with ${selected.name} · ${rate}×.`);}};
    utterance.onend=()=>{if(activeRef.current&&run===runRef.current){indexRef.current=index+1;setTimeout(()=>speakDevice(index+1,run),80);}};
    utterance.onerror=(event:any)=>{if(run===runRef.current&&event?.error!=='canceled'&&event?.error!=='interrupted')fail(event?.error||'synthesis-unavailable');};
    synth.cancel();synth.resume();synth.speak(utterance);
  }

  function start(){
    stopAll(false);
    const choice:Engine=engine==='auto'?'library':engine;
    queueRef.current=choice==='device'?deviceChunks:libraryChunks;
    if(!queueRef.current.length)return;
    activeRef.current=true;indexRef.current=0;setState('loading');setDiag({bytes:0,duration:0});
    const run=runRef.current;
    if(choice==='device')speakDevice(0,run);else void playLibrary(0,run);
  }

  function togglePause(){
    if(state==='paused'){
      if(activeEngine==='library'&&audioRef.current)void audioRef.current.play();
      else if(activeEngine==='device'&&'speechSynthesis' in window)window.speechSynthesis.resume();
      setState('speaking');return;
    }
    if(state==='speaking'){
      if(activeEngine==='library'&&audioRef.current)audioRef.current.pause();
      else if(activeEngine==='device'&&'speechSynthesis' in window)window.speechSynthesis.pause();
      setState('paused');return;
    }
    start();
  }

  function restart(){stopAll(false);setTimeout(start,80);}
  const active=state==='loading'||state==='speaking'||state==='paused';
  const speeds=[.8,.9,1,1.1,1.2,1.35,1.5,1.75,2];

  return <div className="browserReader compactTts">
    <div className="ttsPrimary">
      {!active?<button className="ttsMain" onClick={start}><Play size={17} fill="currentColor"/>{vi?'Nghe':'Listen'}</button>:<button className="ttsMain" onClick={togglePause}>{state==='paused'?<Play size={17}/>:<Pause size={17}/>} {state==='paused'?(vi?'Đọc tiếp':'Resume'):(state==='loading'?(vi?'Đang chuẩn bị…':'Preparing…'):(vi?'Tạm dừng':'Pause'))}</button>}
      <button className="ttsIcon" onClick={()=>stopAll(true)} title={vi?'Dừng':'Stop'}><Square size={16}/></button>
      <button className="ttsIcon" onClick={restart} title={vi?'Đọc lại':'Restart'}><RotateCcw size={16}/></button>
    </div>
    <div className="ttsSettings compactSettings">
      <label><Volume2 size={14}/><span>{vi?'Nguồn':'Engine'}</span><select value={engine} onChange={e=>setEngine(e.target.value as Engine)}><option value="auto">{vi?'Tự động · giọng thư viện':'Auto · library voice'}</option><option value="library">{vi?'Giọng thư viện · neural':'Library voice · neural'}</option><option value="device">{vi?'Giọng thiết bị':'Device voice'}</option></select></label>
      <label><span>{vi?'Tốc độ':'Speed'}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{speeds.map(v=><option value={v} key={v}>{v}×{v===1?(vi?' · chuẩn':' · normal'):''}</option>)}</select></label>
    </div>
    {engine==='device'&&<label className="voicePicker"><span>{vi?'Giọng thiết bị':'Device voice'}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)} disabled={!voices.length}>{voices.length?voices.slice(0,16).map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>):<option>{vi?'Không có giọng phù hợp':'No matching voice'}</option>}</select></label>}
    {state==='loading'&&progress>0&&<div className="ttsStatus"><Volume2 size={14}/><span>{message}</span></div>}
    {message&&state!=='loading'&&<div className={`ttsStatus ${state==='error'?'ttsStatusError':''}`}>{state==='error'?<AlertCircle size={14}/>:<Volume2 size={14}/>}<span>{message}</span>{state==='error'&&<button onClick={start}><RefreshCw size={13}/>{vi?'Thử lại':'Retry'}</button>}</div>}
    <p className="ttsNote">{vi?'Giọng thư viện là giọng neural tiếng Việt, chạy ngay trong trình duyệt và không cần Google/Samsung TTS. Lần đầu tải mô hình khoảng 64 MB, sau đó được lưu trên máy.':'The library neural voice runs in-browser and does not require a device TTS engine.'}</p>
    <span hidden data-testid="tts-diagnostics" data-state={state} data-engine={activeEngine||''} data-audio-bytes={diag.bytes} data-audio-duration={diag.duration.toFixed(3)}/>
  </div>;
}
