import {TtsSession} from '@mintplex-labs/piper-tts-web';

const ctx:any=self;
let sessionPromise:Promise<TtsSession>|null=null;
let sessionVoice='';
let activeRequestId='';

async function getSession(voiceId:string){
  if(sessionPromise&&sessionVoice!==voiceId){
    TtsSession._instance=null;
    sessionPromise=null;
    sessionVoice='';
  }
  if(!sessionPromise){
    sessionVoice=voiceId;
    sessionPromise=TtsSession.create({
      voiceId:voiceId as any,
      progress:(progress:any)=>{
        const total=Number(progress?.total)||0;
        const loaded=Number(progress?.loaded)||0;
        const url=String(progress?.url||'');
        ctx.postMessage({id:activeRequestId,type:'progress',loaded,total,url});
      }
    });
  }
  return sessionPromise;
}

ctx.onmessage=async(event:MessageEvent)=>{
  const {id,text,voiceId}=event.data||{};
  if(!id||!text||!voiceId)return;
  activeRequestId=id;
  try{
    const session=await getSession(String(voiceId));
    const wav=await session.predict(String(text).normalize('NFC').trim());
    const buffer=await wav.arrayBuffer();
    ctx.postMessage({id,type:'result',buffer,mime:wav.type||'audio/x-wav'},[buffer]);
  }catch(error:any){
    ctx.postMessage({id,type:'error',message:String(error?.message||error||'piper-session-failed')});
  }finally{
    if(activeRequestId===id)activeRequestId='';
  }
};

export {};
