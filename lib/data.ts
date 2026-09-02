import collectionsRaw from '@/data/catalog/collections.json';
import suttasRaw from '@/data/catalog/suttas.json';
import audioRaw from '@/data/catalog/audio.json';
import booksRaw from '@/data/catalog/books.json';
import cloudFeaturedRaw from '@/data/audio/cloud-featured.json';
import type {Locale} from '@/lib/i18n';

export type Collection={code:string;viCode:string;pali:string;vi:string;en:string;count:string;descVi:string;descEn:string;accent:string};
type CanonicalSutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];source:{url:string;provider:string;translator:string;license:string;language:string};media:{bookUrl?:string;mp3Url?:string;youtubeId?:string};summary:{vi:string;en:string};practice:{vi:string;en:string};readMinutes:number;featured?:boolean;contentVersion:string};
export type AudioSource={url:string;provider?:string;sha256?:string};
export type AudioSegment={id:string;duration?:number;sources:AudioSource[]};
export type AudioAsset={url:string;segments?:AudioSegment[];label:string;provider:string;sourceUrl?:string;download?:boolean;downloadUrl?:string;manifestVersion?:string;manifestUrl?:string};
type AudioCatalog=Record<string,Partial<Record<Locale,AudioAsset>>>;
type BookCatalog=Record<string,Partial<Record<Locale,BookAsset>>>;
type CloudFeaturedEntry={url:string;provider:string;model?:string;voice?:string;sourceUrl?:string;downloadUrl?:string};
type CloudFeaturedCatalog=Record<string,CloudFeaturedEntry>;
export type BookAsset={url:string;label:string;provider:string;format:string;download?:boolean};
export type Sutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];sourceUrl:string;licenseShort:string;youtubeId?:string;summaryVi:string;summaryEn:string;practiceVi:string;practiceEn:string;readMinutes:number;featured?:boolean;contentVersion:string};

const repoReleaseBase='https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/releases/download';
export const collections=collectionsRaw as Collection[];
export const suttas:Sutta[]=(suttasRaw as CanonicalSutta[]).map(s=>({id:s.id,canonicalRef:s.canonicalRef,slug:s.slug,code:s.code,viCode:s.viCode,collection:s.collection,pali:s.pali,vi:s.vi,en:s.en,topics:s.topics,sourceUrl:s.source.url,licenseShort:`${s.source.translator} · ${s.source.license}`,youtubeId:s.media.youtubeId,summaryVi:s.summary.vi,summaryEn:s.summary.en,practiceVi:s.practice.vi,practiceEn:s.practice.en,readMinutes:s.readMinutes,featured:s.featured,contentVersion:s.contentVersion}));
const audioCatalog=audioRaw as AudioCatalog;
const bookCatalog=booksRaw as BookCatalog;
const cloudFeatured=cloudFeaturedRaw as CloudFeaturedCatalog;
export function collectionDisplayCode(code:string,vi:boolean){if(!vi)return code;return collections.find(c=>c.code===code)?.viCode||code;}
export function suttaDisplayCode(s:Sutta,vi:boolean){return vi?s.viCode:s.code;}
function preservationManifestUrl(s:Sutta,locale:Locale,asset:AudioAsset){
  if(locale!=='vi'||asset.provider!=='5 Đại Tạng Kinh Nikāya')return undefined;
  const m=s.canonicalRef.toLowerCase().match(/^(mn|dn)(\d+)$/);if(!m)return undefined;
  const [,collection,number]=m;return `${repoReleaseBase}/${collection}-vi-segments-v2/${collection}${number}.manifest.json`;
}
export function suttaAudio(s:Sutta,locale:Locale):AudioAsset|undefined{
  if(locale==='vi'){
    const cloud=cloudFeatured[s.canonicalRef.toLowerCase()];
    if(cloud)return{url:cloud.url,downloadUrl:cloud.downloadUrl||cloud.url,label:'Google Cloud TTS HD',provider:cloud.provider,sourceUrl:cloud.sourceUrl,download:true};
  }
  const asset=audioCatalog[s.id]?.[locale];if(!asset)return undefined;
  return{...asset,manifestUrl:asset.manifestUrl||preservationManifestUrl(s,locale,asset)};
}
export function suttaBook(s:Sutta,locale:Locale):BookAsset|undefined{return bookCatalog[s.collection]?.[locale];}
