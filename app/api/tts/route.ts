import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const voiceByLocale:Record<string,string>={
  vi:'vi',en:'en-us',zh:'zh',hi:'hi',es:'es',ar:'ar',fr:'fr',bn:'bn',pt:'pt-br',ru:'ru',id:'id',ur:'ur',de:'de',ja:'ja',ko:'ko',th:'th'
};

function cleanText(value:string,locale:string){
  let text=(value||'').normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,' ')
    .replace(/[–—]/g,', ')
    .replace(/\s+/g,' ')
    .trim();
  if(locale==='vi')text=text.replace(/\bSC\s*(\d+)\b/gi,'Đoạn $1.');
  return text.slice(0,420);
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const locale=String(body?.locale||'vi').toLowerCase();
    const text=cleanText(String(body?.text||''),locale);
    const rate=Math.min(1.5,Math.max(.55,Number(body?.rate)||.8));
    if(!text)return NextResponse.json({error:'missing-text'},{status:400});

    const imported:any=await import('text2wav');
    const text2wav=imported.default||imported;
    const baseWpm=locale==='vi'?120:135;
    const wav=await text2wav(text,{voice:voiceByLocale[locale]||locale.split('-')[0]||'en',speed:Math.max(78,Math.round(baseWpm*rate)),amplitude:112});
    const bytes=wav instanceof Uint8Array?wav:new Uint8Array(wav);
    return new NextResponse(bytes as any,{status:200,headers:{'Content-Type':'audio/wav','Cache-Control':'private, max-age=0, must-revalidate','X-Nikaya-TTS':'espeak-ng'}});
  }catch(error:any){
    console.error('internal-tts-failed',error?.message||error);
    return NextResponse.json({error:'internal-tts-failed'},{status:500});
  }
}
