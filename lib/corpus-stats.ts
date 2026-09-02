import snapshot from '@/data/status/corpus-status.json';

type CollectionStatus={
  collection:string;
  canonicalCount:number;
  catalogCount:number;
  vietnameseFullTextCount:number;
  missingVietnameseCount:number;
  pendingFullTextCount:number;
  audioCount:number;
  status:string;
};

type CorpusStatus={schemaVersion:number;lastVerifiedAt:string;collections:CollectionStatus[]};

const statusUrl='https://raw.githubusercontent.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/main/data/status/corpus-status.json';

function summarize(status:CorpusStatus){
  const collections=status.collections||[];
  return {
    canonicalCount:collections.reduce((sum,x)=>sum+(x.canonicalCount||0),0),
    catalogCount:collections.reduce((sum,x)=>sum+(x.catalogCount||0),0),
    vietnameseFullTextCount:collections.reduce((sum,x)=>sum+(x.vietnameseFullTextCount||0),0),
    pendingFullTextCount:collections.reduce((sum,x)=>sum+(x.pendingFullTextCount||0),0),
    audioCount:collections.reduce((sum,x)=>sum+(x.audioCount||0),0),
    lastVerifiedAt:status.lastVerifiedAt,
    collections
  };
}

export async function getCorpusStats(){
  try{
    const res=await fetch(statusUrl,{next:{revalidate:900},headers:{accept:'application/json'}});
    if(res.ok){
      const live=await res.json() as CorpusStatus;
      if(Array.isArray(live.collections)&&live.collections.length)return summarize(live);
    }
  }catch{}
  return summarize(snapshot as CorpusStatus);
}
