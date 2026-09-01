import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const voiceByLocale:Record<string,string>={
  vi:'vi',en:'en-us',zh:'zh',hi:'hi',es:'es',ar:'ar',fr:'fr',bn:'bn',pt:'pt-br',ru:'ru',id:'id',ur:'ur',de:'de',ja:'ja',ko:'ko',th:'th'
};

function cleanText(value:string){
  return (value||'').normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,' ').replace(/\s+/g,' ').trim().slice(0,420);
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const text=cleanText(String(body?.text||''));
    const locale=String(body?.locale||'vi').toLowerCase();
    const rate=Math.min(2,Math.max(.65,Number(body?.rate)||1));
    if(!text)return NextResponse.json({error:'missing-text'},{status:400});

    const imported:any=await import('text2wav');
    const text2wav=imported.default||imported;
    const wav=await text2wav(text,{voice:voiceByLocale[locale]||locale.split('-')[0]||'en',speed:Math.round(170*rate),amplitude:115});
    const bytes=wav instanceof Uint8Array?wav:new Uint8Array(wav);
    return new NextResponse(bytes as any,{status:200,headers:{'Content-Type':'audio/wav','Cache-Control':'private, max-age=0, must-revalidate','X-Nikaya-TTS':'espeak-ng'}});
  }catch(error:any){
    console.error('internal-tts-failed',error?.message||error);
    return NextResponse.json({error:'internal-tts-failed'},{status:500});
  }
}
