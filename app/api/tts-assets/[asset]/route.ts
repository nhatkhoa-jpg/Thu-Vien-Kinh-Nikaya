import {NextRequest,NextResponse} from 'next/server';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const ASSETS:Record<string,{url:string;type:string}>={
  'espeakng.js':{
    url:'https://cdn.jsdelivr.net/gh/pettarin/espeakng.js-cdn@master/js/espeakng.js',
    type:'application/javascript; charset=utf-8'
  },
  'espeakng.worker.js':{
    url:'https://cdn.jsdelivr.net/gh/pettarin/espeakng.js-cdn@master/js/espeakng.worker.js',
    type:'application/javascript; charset=utf-8'
  },
  'espeakng.worker.data':{
    url:'https://cdn.jsdelivr.net/gh/pettarin/espeakng.js-cdn@master/js/espeakng.worker.data',
    type:'application/octet-stream'
  }
};

export async function GET(_request:NextRequest,{params}:{params:Promise<{asset:string}>}){
  const {asset}=await params;
  const entry=ASSETS[asset];
  if(!entry)return NextResponse.json({error:'not-found'},{status:404});
  try{
    const upstream=await fetch(entry.url,{cache:'force-cache'});
    if(!upstream.ok)return NextResponse.json({error:'upstream-failed',status:upstream.status},{status:502});
    const body=await upstream.arrayBuffer();
    return new NextResponse(body,{status:200,headers:{
      'Content-Type':entry.type,
      'Cache-Control':'public, max-age=31536000, s-maxage=31536000, immutable',
      'Cross-Origin-Resource-Policy':'same-origin',
      'X-Content-Type-Options':'nosniff',
      'X-Nikaya-TTS-Asset':'espeakng-browser-1.49.1'
    }});
  }catch(error:any){
    console.error('tts-asset-proxy-failed',asset,error?.message||error);
    return NextResponse.json({error:'asset-unavailable'},{status:502});
  }
}
