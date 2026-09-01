'use client';

export type PiperProgress={loaded:number;total:number;percent:number;url?:string};
export type PiperStage='importing'|'module-ready'|'session-start'|'model-download'|'session-ready'|'inference-start'|'inference-ready';

const VOICE_BY_LOCALE:Record<string,string>={
  vi:'vi_VN-vais1000-medium',
  en:'en_US-hfc_female-medium',
  zh:'zh_CN-huayan-medium',
  es:'es_ES-davefx-medium',
  fr:'fr_FR-siwis-medium',
  de:'de_DE-thorsten-medium',
  pt:'pt_BR-faber-medium',
  ru:'ru_RU-irina-medium'
};

type Pending={
  resolve:(blob:Blob)=>void;
  reject:(error:Error)=>void;
  onProgress?:(progress:PiperProgress)=>void;
  timer:ReturnType<typeof setTimeout>;
};
type WorkerState={worker:Worker;voiceId:string;pending:Map<string,Pending>};

let workerState:WorkerState|null=null;
let inferenceTail:Promise<void>=Promise.resolve();
let fallbackModulePromise:Promise<typeof import('@mintplex-labs/piper-tts-web')>|null=null;
let fallbackSessionPromise:Promise<any>|null=null;
let fallbackVoice='';
const blobCache=new Map<string,Blob>();
const MAX_CACHE=8;

function cacheKey(voiceId:string,text:string){return `${voiceId}\n${text}`;}
function remember(key:string,blob:Blob){
  if(blobCache.has(key))blobCache.delete(key);
  blobCache.set(key,blob);
  while(blobCache.size>MAX_CACHE){
    const oldest=blobCache.keys().next().value as string|undefined;
    if(!oldest)break;
    blobCache.delete(oldest);
  }
}
function enqueue<T>(task:()=>Promise<T>):Promise<T>{
  const run=inferenceTail.catch(()=>{}).then(task);
  inferenceTail=run.then(()=>undefined,()=>undefined);
  return run;
}
function progressValue(data:any):PiperProgress{
  const total=Number(data?.total)||0;
  const loaded=Number(data?.loaded)||0;
  return {loaded,total,percent:total?Math.max(0,Math.min(100,Math.round(loaded*100/total))):0,url:String(data?.url||'')};
}

function disposeWorker(reason?:Error){
  const state=workerState;
  if(!state)return;
  workerState=null;
  state.worker.terminate();
  if(reason){
    for(const pending of state.pending.values()){
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
  }
  state.pending.clear();
}

function ensureWorker(voiceId:string){
  if(workerState?.voiceId===voiceId)return workerState;
  if(workerState)disposeWorker(new Error('piper-voice-changed'));
  const worker=new Worker(new URL('../workers/piper.worker.ts',import.meta.url),{type:'module',name:'nikaya-piper-session'});
  const state:WorkerState={worker,voiceId,pending:new Map()};
  workerState=state;
  worker.onmessage=(event:MessageEvent)=>{
    const data:any=event.data||{};
    const pending=state.pending.get(String(data.id||''));
    if(!pending)return;
    if(data.type==='progress'){
      pending.onProgress?.(progressValue(data));
      return;
    }
    clearTimeout(pending.timer);
    state.pending.delete(String(data.id));
    if(data.type==='result'){
      pending.resolve(new Blob([data.buffer],{type:String(data.mime||'audio/x-wav')}));
      return;
    }
    const error=new Error(String(data.message||'piper-session-failed'));
    pending.reject(error);
    // If ONNX/session inference fails, rebuild the session once on retry.
    disposeWorker(error);
  };
  worker.onerror=(event:any)=>disposeWorker(new Error(event?.message||'piper-worker-error'));
  return state;
}

async function directPredict(text:string,voiceId:string,onProgress?:(progress:PiperProgress)=>void){
  if(!fallbackModulePromise)fallbackModulePromise=import('@mintplex-labs/piper-tts-web');
  const mod=await fallbackModulePromise;
  if(fallbackVoice!==voiceId){
    mod.TtsSession._instance=null;
    fallbackSessionPromise=null;
    fallbackVoice=voiceId;
  }
  if(!fallbackSessionPromise){
    fallbackSessionPromise=mod.TtsSession.create({
      voiceId:voiceId as any,
      progress:(data:any)=>onProgress?.(progressValue(data))
    });
  }
  const session=await fallbackSessionPromise;
  return session.predict(text);
}

function workerPredict(text:string,voiceId:string,onProgress?:(progress:PiperProgress)=>void):Promise<Blob>{
  if(typeof Worker==='undefined')return directPredict(text,voiceId,onProgress);
  return new Promise((resolve,reject)=>{
    const state=ensureWorker(voiceId);
    const id=`tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timer=setTimeout(()=>{
      state.pending.delete(id);
      reject(new Error('piper-session-timeout'));
      disposeWorker(new Error('piper-session-timeout'));
    },180_000);
    state.pending.set(id,{resolve,reject,onProgress,timer});
    state.worker.postMessage({id,text,voiceId});
  });
}

export function piperVoiceForLocale(locale:string){
  return VOICE_BY_LOCALE[locale.toLowerCase().split('-')[0]]||null;
}

export async function synthesizePiper(
  text:string,
  locale:string,
  onProgress?:(progress:PiperProgress)=>void,
  onStage?:(stage:PiperStage,detail?:string)=>void
):Promise<Blob>{
  const voiceId=piperVoiceForLocale(locale);
  if(!voiceId)throw new Error('piper-language-unavailable');
  const normalized=text.normalize('NFC').trim();
  const key=cacheKey(voiceId,normalized);
  const cached=blobCache.get(key);
  if(cached){remember(key,cached);onStage?.('inference-ready',String(cached.size));return cached;}

  onStage?.('importing');
  onStage?.('module-ready');
  onStage?.('session-start',voiceId);
  return enqueue(async()=>{
    let lastError:any;
    for(let attempt=1;attempt<=2;attempt++){
      try{
        onStage?.('session-ready');
        onStage?.('inference-start');
        const wav=await workerPredict(normalized,voiceId,progress=>{
          onStage?.('model-download',progress.url||'');
          onProgress?.(progress);
        });
        if(!wav||wav.size<1000)throw new Error('piper-empty-audio');
        remember(key,wav);
        onStage?.('inference-ready',String(wav.size));
        return wav;
      }catch(error){
        lastError=error;
        if(attempt<2)await new Promise(resolve=>setTimeout(resolve,300));
      }
    }
    throw lastError||new Error('piper-session-failed');
  });
}

export async function decodeWavDuration(blob:Blob):Promise<number>{
  const Ctx=(window.AudioContext||(window as any).webkitAudioContext) as typeof AudioContext|undefined;
  if(!Ctx)return 0;
  const ctx=new Ctx();
  try{
    const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());
    return decoded.duration||0;
  }finally{
    await ctx.close().catch(()=>{});
  }
}
