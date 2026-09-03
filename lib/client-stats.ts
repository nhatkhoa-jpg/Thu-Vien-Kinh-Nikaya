'use client';

const CENTRAL_STATS_ENDPOINT=(process.env.NEXT_PUBLIC_STATS_ENDPOINT||'https://thu-vien-kinh-nikaya-preview.nhatkhoa-nikaya.workers.dev/api/stats').replace(/\/$/,'');

function visitorId(){
  try{
    const key='nikaya:anon-stats-id';
    let id=localStorage.getItem(key);
    if(!id){id=crypto.randomUUID();localStorage.setItem(key,id)}
    return id;
  }catch{return 'anonymous'}
}

export function sendStat(type:'page_view'|'audio_play'|'audio_30s'|'audio_complete',data:Record<string,unknown>={}){
  if(typeof window==='undefined')return;
  const payload=JSON.stringify({
    type,
    visitorId:visitorId(),
    path:location.pathname,
    referrer:document.referrer||undefined,
    ts:Date.now(),
    ...data
  });
  try{
    if(navigator.sendBeacon){
      navigator.sendBeacon(CENTRAL_STATS_ENDPOINT,new Blob([payload],{type:'application/json'}));
      return;
    }
  }catch{}
  void fetch(CENTRAL_STATS_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:payload,keepalive:true}).catch(()=>{});
}

export async function fetchStats(days=30){
  const url=`${CENTRAL_STATS_ENDPOINT}?days=${Math.max(1,Math.min(90,days))}`;
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok)throw new Error(`Stats unavailable (${res.status})`);
  return res.json();
}
