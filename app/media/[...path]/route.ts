import {env} from 'cloudflare:workers';

const AUDIO_KEY=/^audio\/(dn|mn|sn|an|kn)\/[a-z0-9._-]+\.mp3$/i;
const CACHE_CONTROL='public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

type RouteContext={params:Promise<{path:string[]}>};

function keyFrom(parts:string[]){
  const key=parts.map(part=>decodeURIComponent(part)).join('/');
  return AUDIO_KEY.test(key)?key:null;
}

function bucket(){
  return (env as unknown as {NIKAYA_MEDIA?:any}).NIKAYA_MEDIA;
}

function commonHeaders(object:any){
  const headers=new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set('etag',object.httpEtag||object.etag||'');
  headers.set('accept-ranges','bytes');
  headers.set('cache-control',CACHE_CONTROL);
  headers.set('content-type',headers.get('content-type')||'audio/mpeg');
  return headers;
}

export async function HEAD(_request:Request,{params}:RouteContext){
  const key=keyFrom((await params).path||[]);if(!key)return new Response(null,{status:404});
  const media=bucket();if(!media)return new Response(null,{status:503});
  const object=await media.head(key);if(!object)return new Response(null,{status:404});
  const headers=commonHeaders(object);headers.set('content-length',String(object.size));
  return new Response(null,{status:200,headers});
}

export async function GET(request:Request,{params}:RouteContext){
  const key=keyFrom((await params).path||[]);if(!key)return new Response('Not found',{status:404});
  const media=bucket();if(!media)return new Response('Media unavailable',{status:503});
  const rangeHeader=request.headers.get('range');
  const object=await media.get(key,rangeHeader?{range:request.headers}:undefined);
  if(!object)return new Response('Not found',{status:404});
  const headers=commonHeaders(object);
  let status=200;
  const servedRange=(object as any).range as {offset?:number;length?:number}|undefined;
  if(rangeHeader&&servedRange&&typeof servedRange.offset==='number'&&typeof servedRange.length==='number'){
    const start=servedRange.offset;const end=start+servedRange.length-1;
    headers.set('content-range',`bytes ${start}-${end}/${object.size}`);
    headers.set('content-length',String(servedRange.length));
    status=206;
  }else{
    headers.set('content-length',String(object.size));
  }
  return new Response(object.body,{status,headers});
}
