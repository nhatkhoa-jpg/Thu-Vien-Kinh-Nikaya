import collectionsRaw from '@/data/catalog/collections.json';
import suttasRaw from '@/data/catalog/suttas.json';

export type Collection={code:string;viCode:string;pali:string;vi:string;en:string;count:string;descVi:string;descEn:string;accent:string};
type CanonicalSutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];source:{url:string;provider:string;translator:string;license:string;language:string};media:{bookUrl?:string;mp3Url?:string;youtubeId?:string};summary:{vi:string;en:string};practice:{vi:string;en:string};readMinutes:number;featured?:boolean;contentVersion:string};
export type Sutta={id:string;canonicalRef:string;slug:string;code:string;viCode:string;collection:string;pali:string;vi:string;en:string;topics:string[];sourceUrl:string;licenseShort:string;bookUrl?:string;mp3Url?:string;youtubeId?:string;summaryVi:string;summaryEn:string;practiceVi:string;practiceEn:string;readMinutes:number;featured?:boolean;contentVersion:string};

export const collections=collectionsRaw as Collection[];
export const suttas:Sutta[]=(suttasRaw as CanonicalSutta[]).map(s=>({id:s.id,canonicalRef:s.canonicalRef,slug:s.slug,code:s.code,viCode:s.viCode,collection:s.collection,pali:s.pali,vi:s.vi,en:s.en,topics:s.topics,sourceUrl:s.source.url,licenseShort:`${s.source.translator} · ${s.source.license}`,bookUrl:s.media.bookUrl,mp3Url:s.media.mp3Url,youtubeId:s.media.youtubeId,summaryVi:s.summary.vi,summaryEn:s.summary.en,practiceVi:s.practice.vi,practiceEn:s.practice.en,readMinutes:s.readMinutes,featured:s.featured,contentVersion:s.contentVersion}));
export function collectionDisplayCode(code:string,vi:boolean){if(!vi)return code;return collections.find(c=>c.code===code)?.viCode||code;}
export function suttaDisplayCode(s:Sutta,vi:boolean){return vi?s.viCode:s.code;}
