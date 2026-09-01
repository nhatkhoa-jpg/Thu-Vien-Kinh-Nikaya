import * as tts from '@diffusionstudio/vits-web';

const ctx:any=self;

ctx.onmessage=async(event:MessageEvent)=>{
  const {id,text,voiceId}=event.data||{};
  if(!id||!text||!voiceId)return;
  try{
    const wav=await tts.predict({text:String(text).normalize('NFC').trim(),voiceId:voiceId as any},(progress:any)=>{
      const total=Number(progress?.total)||0;
      const loaded=Number(progress?.loaded)||0;
      const url=String(progress?.url||'');
      ctx.postMessage({id,type:'progress',loaded,total,url});
    });
    const buffer=await wav.arrayBuffer();
    ctx.postMessage({id,type:'result',buffer,mime:wav.type||'audio/x-wav'},[buffer]);
  }catch(error:any){
    ctx.postMessage({id,type:'error',message:String(error?.message||error||'piper-worker-failed')});
  }
};

export {};
