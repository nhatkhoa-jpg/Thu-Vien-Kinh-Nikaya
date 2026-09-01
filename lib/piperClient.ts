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

let modulePromise:Promise<typeof import('@diffusionstudio/vits-web')>|null=null;
let inferenceTail:Promise<void>=Promise.resolve();
const blobCache=new Map<string,Blob>();
const MAX_CACHE=5;

function moduleLoader(){
  if(!modulePromise)modulePromise=import('@diffusionstudio/vits-web');
  return modulePromise;
}

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

async function directPredict(text:string,voiceId:string,onProgress?:(progress:PiperProgress)=>void){
  const tts=await moduleLoader();
  return tts.predict({text,voiceId:voiceId as any},(progress:any)=>{
    const total=Number(progress?.total)||0;
    const loaded=Number(progress?.loaded)||0;
    const url=String(progress?.url||'');
    onProgress?.({loaded,total,percent:total?Math.max(0,Math.min(100,Math.round(loaded*100/total))):0,url});
  });
}

function workerPredict(text:string,voiceId:string,onProgress?:(progress:PiperProgress)=>void):Promise<Blob>{
  return new Promise((resolve,reject)=>{
    if(typeof Worker==='undefined'){
      void directPredict(text,voiceId,onProgress).then(resolve,reject);
      return;
    }
    let settled=false;
    const worker=new Worker(new URL('../workers/piper.worker.ts',import.meta.url),{type:'module',name:'nikaya-piper'});
    const id=`tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const cleanup=()=>{clearTimeout(timer);worker.terminate();};
    const fail=(error:any)=>{if(settled)return;settled=true;cleanup();reject(error instanceof Error?error:new Error(String(error||'piper-worker-failed')));};
    const timer=setTimeout(()=>fail(new Error('piper-worker-timeout')),180_000);
    worker.onerror=(event:any)=>fail(new Error(event?.message||'piper-worker-error'));
    worker.onmessage=(event:MessageEvent)=>{
      const data:any=event.data||{};
      if(data.id!==id)return;
      if(data.type==='progress'){
        const total=Number(data.total)||0;
        const loaded=Number(data.loaded)||0;
        onProgress?.({loaded,total,percent:total?Math.max(0,Math.min(100,Math.round(loaded*100/total))):0,url:String(data.url||'')});
        return;
      }
      if(data.type==='error'){fail(new Error(String(data.message||'piper-worker-failed')));return;}
      if(data.type==='result'){
        if(settled)return;
        settled=true;
        cleanup();
        const blob=new Blob([data.buffer],{type:String(data.mime||'audio/x-wav')});
        resolve(blob);
      }
    };
    worker.postMessage({id,text,voiceId});
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
  if(cached){
    remember(key,cached);
    onStage?.('inference-ready',String(cached.size));
    return cached;
  }

  onStage?.('importing');
  onStage?.('module-ready');
  onStage?.('session-start',voiceId);
  onStage?.('session-ready');

  return enqueue(async()=>{
    onStage?.('inference-start');
    let lastError:any;
    for(let attempt=1;attempt<=2;attempt++){
      try{
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
        if(attempt<2)await new Promise(resolve=>setTimeout(resolve,350));
      }
    }
    throw lastError||new Error('piper-worker-failed');
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
