export const ANALYTICS_ENDPOINT='https://thu-vien-kinh-nikaya-analytics.nhatkhoa-nikaya.workers.dev';

export type AnalyticsEvent='view'|'play'|'listen30'|'complete';

export function sendAnalyticsEvent(event:AnalyticsEvent,ref:string,locale?:string){
  if(typeof window==='undefined'||!ref)return;
  const body=JSON.stringify({event,ref,locale});
  const url=`${ANALYTICS_ENDPOINT}/event`;
  try{
    if(navigator.sendBeacon){
      const blob=new Blob([body],{type:'application/json'});
      if(navigator.sendBeacon(url,blob))return;
    }
  }catch{}
  void fetch(url,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true,mode:'cors'}).catch(()=>{});
}
