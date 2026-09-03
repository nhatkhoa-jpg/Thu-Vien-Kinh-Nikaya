import {env} from 'cloudflare:workers';

const ORIGIN='*';
const ALLOWED=new Set(['page_view','audio_play','audio_30s','audio_complete']);

function bucket(){return (env as unknown as {NIKAYA_MEDIA?:any}).NIKAYA_MEDIA}
function cors(extra:Record<string,string>={}){return {'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type',...extra}}
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:cors({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function clean(value:unknown,max=180){return typeof value==='string'?value.replace(/[\r\n\t]/g,' ').slice(0,max):''}
function dayKey(ts:number){return new Date(ts).toISOString().slice(0,10)}

export async function OPTIONS(){return new Response(null,{status:204,headers:cors()})}

export async function POST(request:Request){
  const media=bucket();if(!media)return json({ok:false,error:'stats storage unavailable'},503);
  let body:any;
  try{body=await request.json()}catch{return json({ok:false,error:'invalid json'},400)}
  const type=clean(body?.type,32);
  if(!ALLOWED.has(type))return json({ok:false,error:'invalid event'},400);
  const now=Date.now();
  const clientTs=Number(body?.ts);
  const ts=Number.isFinite(clientTs)&&Math.abs(clientTs-now)<86_400_000?clientTs:now;
  const visitorId=clean(body?.visitorId,80)||'anonymous';
  const path=clean(body?.path,220)||'/';
  const audioId=clean(body?.audioId,180);
  const title=clean(body?.title,180);
  const locale=path.split('/').filter(Boolean)[0]||'vi';
  const key=`stats/events/${dayKey(ts)}/${String(ts).padStart(13,'0')}-${crypto.randomUUID()}`;
  await media.put(key,'',{customMetadata:{type,visitorId,path,audioId,title,locale,ts:String(ts)}});
  return json({ok:true},201);
}

type EventRow={type:string;visitorId:string;path:string;audioId:string;title:string;locale:string;ts:number};

async function readEvents(media:any,days:number){
  const since=Date.now()-days*86_400_000;
  const startDay=dayKey(since);
  const out:EventRow[]=[];
  let cursor: string|undefined;
  let pages=0;
  do{
    const listed=await media.list({prefix:'stats/events/',limit:1000,cursor,include:['customMetadata']});
    for(const obj of listed.objects||[]){
      const day=String(obj.key||'').split('/')[2]||'';
      if(day<startDay)continue;
      const m=obj.customMetadata||{};
      const ts=Number(m.ts)||new Date(obj.uploaded||0).getTime();
      if(ts<since)continue;
      out.push({type:String(m.type||''),visitorId:String(m.visitorId||'anonymous'),path:String(m.path||'/'),audioId:String(m.audioId||''),title:String(m.title||''),locale:String(m.locale||''),ts});
    }
    cursor=listed.truncated?listed.cursor:undefined;
    pages++;
  }while(cursor&&pages<50);
  return out;
}

function top(map:Map<string,number>,limit=12){return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([name,count])=>({name,count}))}

export async function GET(request:Request){
  const media=bucket();if(!media)return json({ok:false,error:'stats storage unavailable'},503);
  const url=new URL(request.url);
  const days=Math.max(1,Math.min(90,Number(url.searchParams.get('days'))||30));
  const events=await readEvents(media,days);
  const pageViews=events.filter(x=>x.type==='page_view');
  const audioPlays=events.filter(x=>x.type==='audio_play');
  const audio30=events.filter(x=>x.type==='audio_30s');
  const complete=events.filter(x=>x.type==='audio_complete');
  const visitorSet=new Set(pageViews.map(x=>x.visitorId));
  const listenerSet=new Set(audioPlays.map(x=>x.visitorId));
  const pages=new Map<string,number>();pageViews.forEach(x=>pages.set(x.path,(pages.get(x.path)||0)+1));
  const audios=new Map<string,number>();audioPlays.forEach(x=>{const name=x.title||x.audioId||x.path;audios.set(name,(audios.get(name)||0)+1)});
  const daily=new Map<string,{date:string;views:number;visitors:Set<string>;plays:number;listeners:Set<string>;listen30:number;complete:number}>();
  events.forEach(e=>{
    const date=dayKey(e.ts);let d=daily.get(date);
    if(!d){d={date,views:0,visitors:new Set(),plays:0,listeners:new Set(),listen30:0,complete:0};daily.set(date,d)}
    if(e.type==='page_view'){d.views++;d.visitors.add(e.visitorId)}
    if(e.type==='audio_play'){d.plays++;d.listeners.add(e.visitorId)}
    if(e.type==='audio_30s')d.listen30++;
    if(e.type==='audio_complete')d.complete++;
  });
  const dailyRows=[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({date:d.date,views:d.views,visitors:d.visitors.size,plays:d.plays,listeners:d.listeners.size,listen30:d.listen30,complete:d.complete}));
  return json({
    ok:true,days,generatedAt:new Date().toISOString(),
    totals:{views:pageViews.length,visitors:visitorSet.size,audioPlays:audioPlays.length,listeners:listenerSet.size,listen30:audio30.length,audioComplete:complete.length},
    topPages:top(pages),topAudio:top(audios),daily:dailyRows
  });
}
