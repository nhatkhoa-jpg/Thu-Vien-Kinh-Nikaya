'use client';

export type PiperProgress = {loaded:number; total:number; percent:number; url?:string};
export type PiperStage = 'importing'|'module-ready'|'session-start'|'model-download'|'session-ready'|'inference-start'|'inference-ready';

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

let modulePromise:Promise<typeof import('@mintplex-labs/piper-tts-web')>|null=null;
let sessionPromise:Promise<any>|null=null;
let sessionVoice='';

function moduleLoader(){
  if(!modulePromise)modulePromise=import('@mintplex-labs/piper-tts-web');
  return modulePromise;
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
  onStage?.('importing');
  const tts=await moduleLoader();
  onStage?.('module-ready');

  if(!sessionPromise||sessionVoice!==voiceId){
    sessionVoice=voiceId;
    onStage?.('session-start',voiceId);
    sessionPromise=tts.TtsSession.create({
      voiceId,
      progress:(progress:any)=>{
        const total=Number(progress?.total)||0;
        const loaded=Number(progress?.loaded)||0;
        const url=String(progress?.url||'');
        onStage?.('model-download',url);
        onProgress?.({loaded,total,percent:total?Math.max(0,Math.min(100,Math.round(loaded*100/total))):0,url});
      },
      logger:(line:string)=>console.info('[nikaya-piper]',line)
    }).catch((error:any)=>{sessionPromise=null;sessionVoice='';throw error;});
  }
  const session=await sessionPromise;
  onStage?.('session-ready');
  onStage?.('inference-start');
  const wav=await session.predict(text.normalize('NFC').trim());
  onStage?.('inference-ready',String(wav?.size||0));
  if(!wav||wav.size<1000)throw new Error('piper-empty-audio');
  return wav;
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
