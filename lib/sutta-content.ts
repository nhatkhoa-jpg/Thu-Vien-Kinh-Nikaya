import type {Locale} from '@/lib/i18n';

export type FullTextSegment={id:string;text:string};
export type FullTextResult={language:string;author:string;authorUid:string;sourceUrl:string;segments:FullTextSegment[];title?:string};

const localeMap:Partial<Record<Locale,string>>={ja:'jpn'};
const preferredAuthors:Partial<Record<Locale,string>>={vi:'minh_chau',en:'sujato'};
const apiBase='https://suttacentral.net/api';

export function normalizeScriptureText(value:string){
  return value
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g,'')
    .replace(/\u00AD/g,'')
    .replace(/\s+([\u0300-\u036f])/gu,'$1')
    .normalize('NFC');
}

function clean(value:string){
  return normalizeScriptureText(value
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&quot;/g,'"')
    .replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/\s+/g,' ')
    .trim());
}

function normalizeSegments(segments:FullTextSegment[]){
  return segments
    .map(segment=>({...segment,text:normalizeScriptureText(String(segment.text??'')).trim()}))
    .filter(segment=>segment.text.length>0);
}

async function fetchJson(url:string){
  const res=await fetch(url,{next:{revalidate:86400},headers:{accept:'application/json'}});
  if(!res.ok)throw new Error(`Sutta source returned ${res.status}`);
  return res.json();
}

function extractSegments(data:any):FullTextSegment[]{
  let raw=data?.translation_text ?? data?.translation?.text ?? data?.translation ?? data?.text;
  if(raw && typeof raw==='object' && 'text' in raw)raw=raw.text;
  if(typeof raw==='string'){
    return raw.split(/\n{2,}|<\/p>/i).map((text:string,index:number)=>({id:`p${index+1}`,text:clean(text)})).filter((x:FullTextSegment)=>x.text.length>0);
  }
  if(!raw || typeof raw!=='object')return [];
  const keys=Array.isArray(data?.keys_order)&&data.keys_order.length?data.keys_order:Object.keys(raw);
  return keys.map((id:string)=>({id,text:clean(String(raw[id]??''))})).filter((x:FullTextSegment)=>x.text.length>0);
}

async function fetchTranslation(uid:string,language:string,preferredAuthor?:string):Promise<FullTextResult|null>{
  try{
    const info=await fetchJson(`${apiBase}/suttas/${encodeURIComponent(uid)}`);
    const translations=Array.isArray(info?.suttaplex?.translations)?info.suttaplex.translations:[];
    const sameLanguage=translations.filter((t:any)=>t?.lang===language);
    if(!sameLanguage.length)return null;
    const chosen=(preferredAuthor&&sameLanguage.find((t:any)=>t?.author_uid===preferredAuthor))||sameLanguage.find((t:any)=>t?.segmented)||sameLanguage[0];
    const authorUid=chosen.author_uid;
    let payload:any=null;
    if(chosen.segmented){
      try{payload=await fetchJson(`${apiBase}/bilarasuttas/${encodeURIComponent(uid)}/${encodeURIComponent(authorUid)}?lang=${encodeURIComponent(language)}`);}catch{}
    }
    let segments=extractSegments(payload);
    if(!segments.length){
      payload=await fetchJson(`${apiBase}/suttas/${encodeURIComponent(uid)}/${encodeURIComponent(authorUid)}?lang=${encodeURIComponent(language)}`);
      segments=extractSegments(payload);
    }
    if(!segments.length)return null;
    const localizedTitle=clean(String(chosen?.name||chosen?.title||chosen?.translation_title||''));
    return {language,author:chosen.author||chosen.author_short||authorUid,authorUid,sourceUrl:`https://suttacentral.net/${uid}/${language}/${authorUid}`,segments:normalizeSegments(segments),title:localizedTitle||undefined};
  }catch{return null;}
}

export async function getSuttaFullText(uid:string,locale:Locale):Promise<FullTextResult|null>{
  const language=localeMap[locale]||locale;
  const primary=await fetchTranslation(uid,language,preferredAuthors[locale]);
  if(primary)return primary;
  if(language!=='en')return fetchTranslation(uid,'en',preferredAuthors.en);
  return null;
}
