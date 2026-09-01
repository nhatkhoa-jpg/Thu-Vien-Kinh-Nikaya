import collectionsRaw from '@/data/catalog/collections.json';
import suttasRaw from '@/data/catalog/suttas.json';
import audioRaw from '@/data/catalog/audio.json';
import booksRaw from '@/data/catalog/books.json';
import type {Locale} from '@/lib/i18n';

export type Collection={code:string;viCode:string;pali:string;vi:string;en:string;count:string;descVi:string;descEn:string;accent:string};
type CanonicalSutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];source:{url:string;provider:string;translator:string;license:string;language:string};media:{bookUrl?:string;mp3Url?:string;youtubeId?:string};summary:{vi:string;en:string};practice:{vi:string;en:string};readMinutes:number;featured?:boolean;contentVersion:string};
export type AudioSource={url:string;provider?:string;sha256?:string};
export type AudioSegment={id:string;duration?:number;sources:AudioSource[]};
export type AudioAsset={url:string;segments?:AudioSegment[];label:string;provider:string;sourceUrl?:string;download?:boolean;downloadUrl?:string;manifestVersion?:string};
export type BookAsset={url:string;label:string;provider:string;format:string;download?:boolean};
type AudioCatalog=Record<string,Partial<Record<Locale,AudioAsset>>>;
type BookCatalog=Record<string,Partial<Record<Locale,BookAsset>>>;
export type Sutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];sourceUrl:string;licenseShort:string;youtubeId?:string;summaryVi:string;summaryEn:string;practiceVi:string;practiceEn:string;readMinutes:number;featured?:boolean;contentVersion:string};

export const collections=collectionsRaw as Collection[];
export const suttas:Sutta[]=(suttasRaw as CanonicalSutta[]).map(s=>({id:s.id,canonicalRef:s.canonicalRef,slug:s.slug,code:s.code,viCode:s.viCode,collection:s.collection,pali:s.pali,vi:s.vi,en:s.en,topics:s.topics,sourceUrl:s.source.url,licenseShort:`${s.source.translator} · ${s.source.license}`,youtubeId:s.media.youtubeId,summaryVi:s.summary.vi,summaryEn:s.summary.en,practiceVi:s.practice.vi,practiceEn:s.practice.en,readMinutes:s.readMinutes,featured:s.featured,contentVersion:s.contentVersion}));
const audioCatalog=audioRaw as AudioCatalog;
const bookCatalog=booksRaw as BookCatalog;
export function collectionDisplayCode(code:string,vi:boolean){if(!vi)return code;return collections.find(c=>c.code===code)?.viCode||code;}
export function suttaDisplayCode(s:Sutta,vi:boolean){return vi?s.viCode:s.code;}
export function suttaAudio(s:Sutta,locale:Locale):AudioAsset|undefined{return audioCatalog[s.id]?.[locale];}
export function suttaBook(s:Sutta,locale:Locale):BookAsset|undefined{return bookCatalog[s.collection]?.[locale];}
