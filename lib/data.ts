import collectionsRaw from '@/data/catalog/collections.json';
import suttasRaw from '@/data/catalog/suttas.json';
import audioRaw from '@/data/catalog/audio.json';
import booksRaw from '@/data/catalog/books.json';
import {materializedVi} from '@/lib/materialized-content.generated';
import type {Locale} from '@/lib/i18n';

export type Collection={code:string;viCode:string;pali:string;vi:string;en:string;count:string;descVi:string;descEn:string;accent:string};
type CanonicalSutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];source:{url:string;provider:string;translator:string;license:string;language:string};media:{bookUrl?:string;mp3Url?:string;youtubeId?:string};summary:{vi:string;en:string};practice:{vi:string;en:string};readMinutes:number;featured?:boolean;contentVersion:string};
export type AudioSource={url:string;provider?:string;sha256?:string};
export type AudioSegment={id:string;duration?:number;sources:AudioSource[]};
export type AudioAsset={url:string;segments?:AudioSegment[];label:string;provider:string;sourceUrl?:string;download?:boolean;downloadUrl?:string;manifestVersion?:string;manifestUrl?:string};
export type BookAsset={url:string;label:string;provider:string;format:string;download?:boolean};
type AudioCatalog=Record<string,Partial<Record<Locale,AudioAsset>>>;
type BookCatalog=Record<string,Partial<Record<Locale,BookAsset>>>;
type MaterializedEntry={canonicalRef?:string;collection?:string;author?:string;sourceUrl?:string;license?:string;segments?:Array<{id?:string;text?:string}>;contentVersion?:string;materializedAt?:string};
export type Sutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];sourceUrl:string;licenseShort:string;youtubeId?:string;summaryVi:string;summaryEn:string;practiceVi:string;practiceEn:string;readMinutes:number;featured?:boolean;contentVersion:string};

const repoReleaseBase='https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/releases/download';
export const collections=collectionsRaw as Collection[];

function slugifyCanonical(ref:string){return ref.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function displayCode(ref:string){return ref.toUpperCase().replace(/^([A-Z]+)(\d)/,'$1 $2');}
function viCodeFor(ref:string,collection:string){
  const prefix=collections.find(c=>c.code===collection)?.viCode||collection;
  const suffix=ref.toLowerCase().replace(collection.toLowerCase(),'');
  return `${prefix} ${suffix}`.trim();
}
function cleanDerivedTitle(value:string,ref:string){
  const escaped=ref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const withoutRef=value.replace(new RegExp(`^${escaped}\\.?\\s*`,'i'),'').replace(/^\d+(?:\.\d+)*\.?\s*/,'').trim();
  return withoutRef||`Bài kinh ${ref.toUpperCase()}`;
}
function deriveTitle(entry:MaterializedEntry,ref:string){
  const texts=(entry.segments||[]).map(x=>String(x.text||'').trim()).filter(Boolean);
  const specific=texts.find(text=>/^\d+(?:\.\d+)+\.?\s+\S/.test(text))||texts.find(text=>text.toLowerCase().includes(ref.toLowerCase()))||texts[2]||texts[0]||'';
  return cleanDerivedTitle(specific,ref);
}
function estimateMinutes(entry:MaterializedEntry){
  const words=(entry.segments||[]).reduce((n,s)=>n+String(s.text||'').split(/\s+/).filter(Boolean).length,0);
  return words?Math.max(1,Math.ceil(words/200)):0;
}

const curated:Sutta[]=(suttasRaw as CanonicalSutta[]).map(s=>({id:s.id,canonicalRef:s.canonicalRef,slug:s.slug,code:s.code,viCode:s.viCode,collection:s.collection,pali:s.pali,vi:s.vi,en:s.en,topics:s.topics,sourceUrl:s.source.url,licenseShort:`${s.source.translator} · ${s.source.license}`,youtubeId:s.media.youtubeId,summaryVi:s.summary.vi,summaryEn:s.summary.en,practiceVi:s.practice.vi,practiceEn:s.practice.en,readMinutes:s.readMinutes,featured:s.featured,contentVersion:s.contentVersion}));
const curatedRefs=new Set(curated.map(s=>s.canonicalRef.toLowerCase()));
const generated:Sutta[]=Object.entries(materializedVi as Record<string,MaterializedEntry>).flatMap(([key,entry])=>{
  const canonicalRef=String(entry.canonicalRef||key).toLowerCase();
  if(curatedRefs.has(canonicalRef))return [];
  const collection=String(entry.collection||canonicalRef.match(/^[a-z]+/i)?.[0]||'').toUpperCase();
  if(!collections.some(c=>c.code===collection))return [];
  const title=deriveTitle(entry,canonicalRef);
  const code=displayCode(canonicalRef);
  return [{
    id:`nikaya.${canonicalRef}`,
    canonicalRef,
    slug:slugifyCanonical(canonicalRef),
    code,
    viCode:viCodeFor(canonicalRef,collection),
    collection,
    pali:'',
    vi:title,
    en:`Discourse ${code}`,
    topics:[],
    sourceUrl:String(entry.sourceUrl||`https://suttacentral.net/${canonicalRef}/vi/minh_chau`),
    licenseShort:`${entry.author||'Bản dịch nguồn'} · ${entry.license||'Xem ghi chú quyền sử dụng tại nguồn'}`,
    summaryVi:'',
    summaryEn:'',
    practiceVi:'',
    practiceEn:'',
    readMinutes:estimateMinutes(entry),
    featured:false,
    contentVersion:String(entry.contentVersion||entry.materializedAt||'materialized-v1'),
  }];
});

export const suttas:Sutta[]=[...curated,...generated].sort((a,b)=>a.collection.localeCompare(b.collection)||a.canonicalRef.localeCompare(b.canonicalRef,undefined,{numeric:true}));
const audioCatalog=audioRaw as AudioCatalog;
const bookCatalog=booksRaw as BookCatalog;
export function collectionDisplayCode(code:string,vi:boolean){if(!vi)return code;return collections.find(c=>c.code===code)?.viCode||code;}
export function suttaDisplayCode(s:Sutta,vi:boolean){return vi?s.viCode:s.code;}
function preservationManifestUrl(s:Sutta,locale:Locale,asset:AudioAsset){
  if(locale!=='vi'||asset.provider!=='5 Đại Tạng Kinh Nikāya')return undefined;
  const m=s.canonicalRef.toLowerCase().match(/^(mn|dn)(\d+)$/);if(!m)return undefined;
  const [,collection,number]=m;return `${repoReleaseBase}/${collection}-vi-segments-v2/${collection}${number}.manifest.json`;
}
export function suttaAudio(s:Sutta,locale:Locale):AudioAsset|undefined{
  const asset=audioCatalog[s.id]?.[locale];if(!asset)return undefined;
  return{...asset,manifestUrl:asset.manifestUrl||preservationManifestUrl(s,locale,asset)};
}
export function suttaBook(s:Sutta,locale:Locale):BookAsset|undefined{return bookCatalog[s.collection]?.[locale];}
