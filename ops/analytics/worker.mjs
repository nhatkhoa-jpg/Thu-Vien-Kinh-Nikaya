const EVENT_TYPES=new Set(['view','play','listen30','complete']);
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra}});

function corsHeaders(request){
  const origin=request.headers.get('Origin')||'';
  const allowed=/^https:\/\/(?:thu-vien-kinh-nikaya(?:-preview)?|thu-vien-kinh-nikaya-analytics)\.nhatkhoa-nikaya\.workers\.dev$/.test(origin)||/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin);
  return allowed?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'}:{};
}

export class StatsDO{
  constructor(state){this.state=state;}
  async increment(key,amount=1){
    const current=Number(await this.state.storage.get(key)||0);
    await this.state.storage.put(key,current+amount);
  }
  async fetch(request){
    const url=new URL(request.url);
    if(request.method==='POST'&&url.pathname==='/event'){
      let body;
      try{body=await request.json();}catch{return json({error:'invalid-json'},400);}
      const event=String(body?.event||'');
      const ref=String(body?.ref||'').slice(0,160);
      const locale=String(body?.locale||'').slice(0,16);
      if(!EVENT_TYPES.has(event)||!ref)return json({error:'invalid-event'},400);
      await this.increment(`tot:${event}`);
      await this.increment(`ref:${ref}:${event}`);
      if(locale)await this.increment(`locale:${locale}:${event}`);
      await this.state.storage.put('meta:lastUpdated',new Date().toISOString());
      return new Response(null,{status:204});
    }
    if(request.method==='GET'&&url.pathname==='/summary'){
      const rows=await this.state.storage.list();
      const totals={view:0,play:0,listen30:0,complete:0};
      const refs={};
      const locales={};
      let lastUpdated=null;
      for(const [key,value] of rows){
        if(key==='meta:lastUpdated'){lastUpdated=value;continue;}
        const n=Number(value||0);
        if(key.startsWith('tot:')){const event=key.slice(4);if(event in totals)totals[event]=n;continue;}
        if(key.startsWith('ref:')){
          const rest=key.slice(4);const cut=rest.lastIndexOf(':');if(cut<1)continue;
          const ref=rest.slice(0,cut),event=rest.slice(cut+1);refs[ref]??={view:0,play:0,listen30:0,complete:0};if(event in refs[ref])refs[ref][event]=n;continue;
        }
        if(key.startsWith('locale:')){
          const [,locale,event]=key.split(':');locales[locale]??={view:0,play:0,listen30:0,complete:0};if(event in locales[locale])locales[locale][event]=n;
        }
      }
      const top=Object.entries(refs).map(([ref,counts])=>({ref,...counts})).sort((a,b)=>(b.play+b.view)-(a.play+a.view)).slice(0,100);
      return json({version:1,lastUpdated,totals,locales,top});
    }
    return json({error:'not-found'},404);
  }
}

export default{
  async fetch(request,env){
    const headers=corsHeaders(request);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(url.pathname==='/health')return json({ok:true,service:'nikaya-analytics'},200,headers);
    const id=env.STATS.idFromName('global');
    const response=await env.STATS.get(id).fetch(request);
    const out=new Response(response.body,response);
    for(const [k,v] of Object.entries(headers))out.headers.set(k,v);
    return out;
  }
};
