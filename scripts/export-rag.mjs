import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const suttas=JSON.parse(readFileSync(new URL('../data/catalog/suttas.json',import.meta.url),'utf8'));
const outDir=new URL('../data/exports/',import.meta.url);
mkdirSync(outDir,{recursive:true});

const contentDir=new URL('../data/content/',import.meta.url);
const materializedVi={};
function loadCorpus(path){
  if(!existsSync(path))return;
  for(const name of readdirSync(path).sort()){
    const target=join(path,name);const stat=statSync(target);
    if(stat.isDirectory())loadCorpus(target);
    else if(name.endsWith('.vi.json'))Object.assign(materializedVi,JSON.parse(readFileSync(target,'utf8')));
  }
}
loadCorpus(contentDir.pathname);

const normalize=text=>String(text??'').replace(/\s+/g,' ').trim();
const sha=text=>createHash('sha256').update(normalize(text),'utf8').digest('hex');
const line=obj=>JSON.stringify(obj);

function makeChunk(s,lang,section,text,provenance){
  const clean=normalize(text);if(!clean)return null;
  const title=lang==='vi'?s.vi:s.en;
  const contentHash=`sha256:${sha(clean)}`;
  return {chunk_id:`${s.id}:${lang}:${section}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,section,title,pali_title:s.pali,text:clean,topics:s.topics,source_url:provenance?.sourceUrl||s.source.url,source_provider:provenance?.source||s.source.provider,translator:provenance?.author||s.source.translator,license:provenance?.license||s.source.license,content_version:s.contentVersion,content_hash:contentHash,embedding_cache_key:contentHash};
}

function fullTextChunks(s,record){
  const output=[];let texts=[];let ids=[];let size=0;
  const flush=()=>{if(!texts.length)return;output.push(makeChunk(s,'vi',`fulltext-${ids[0]}-${ids.at(-1)}`,texts.join('\n\n'),record));texts=[];ids=[];size=0;};
  for(const segment of record?.segments||[]){
    const text=normalize(segment.text);if(!text)continue;
    if(size&&size+text.length>3200)flush();
    texts.push(text);ids.push(segment.id);size+=text.length;
  }
  flush();return output;
}

function metadataText(s,lang){
  const title=lang==='vi'?s.vi:s.en;
  const code=lang==='vi'?`${s.viCode} (${s.code})`:s.code;
  return normalize(`${code}. ${title}. Pāli: ${s.pali}. Collection: ${s.collection}.`);
}

function makeDocument(s,lang,record){
  const title=lang==='vi'?s.vi:s.en;
  const full=lang==='vi'?(record?.segments||[]).map(x=>normalize(x.text)).filter(Boolean).join('\n\n'):'';
  const parts=[metadataText(s,lang),full,s.summary[lang],s.practice[lang]].map(normalize).filter(Boolean);
  const text=parts.join('\n\n');
  return {document_id:`${s.id}:${lang}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,title,pali_title:s.pali,text,topics:s.topics,source_url:s.source.url,translator:s.source.translator,license:s.source.license,content_version:s.contentVersion,content_hash:`sha256:${sha(text)}`};
}

for(const lang of ['vi','en']){
  const chunks=[];const documents=[];
  for(const s of suttas){
    const record=lang==='vi'?materializedVi[s.canonicalRef]:null;
    const backed=record?fullTextChunks(s,record):[];
    if(backed.length)chunks.push(...backed);
    else{
      const summary=makeChunk(s,lang,'summary',s.summary[lang]);
      const practice=makeChunk(s,lang,'practice',s.practice[lang]);
      if(summary)chunks.push(summary);
      if(practice)chunks.push(practice);
      if(!summary&&!practice)chunks.push(makeChunk(s,lang,'catalog',metadataText(s,lang)));
    }
    documents.push(makeDocument(s,lang,record));
  }
  writeFileSync(new URL(`nikaya-rag.${lang}.jsonl`,outDir),chunks.map(line).join('\n')+'\n');
  writeFileSync(new URL(`nikaya-knowledge.${lang}.jsonl`,outDir),documents.map(line).join('\n')+'\n');
  console.log(`Exported ${documents.length} ${lang} documents and ${chunks.length} non-empty RAG chunks.`);
}
