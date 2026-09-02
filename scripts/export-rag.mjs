import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const suttas=JSON.parse(readFileSync(new URL('../data/catalog/suttas.json',import.meta.url),'utf8'));
const outDir=new URL('../data/exports/',import.meta.url);
mkdirSync(outDir,{recursive:true});

const normalize=text=>String(text??'').replace(/\s+/g,' ').trim();
const sha=text=>createHash('sha256').update(normalize(text),'utf8').digest('hex');
const line=obj=>JSON.stringify(obj);

function makeChunk(s,lang,section,text){
  const clean=normalize(text);if(!clean)return null;
  const title=lang==='vi'?s.vi:s.en;
  const contentHash=`sha256:${sha(clean)}`;
  return {chunk_id:`${s.id}:${lang}:${section}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,section,title,pali_title:s.pali,text:clean,topics:s.topics,source_url:s.source.url,source_provider:s.source.provider,translator:s.source.translator,license:s.source.license,content_version:s.contentVersion,content_hash:contentHash,embedding_cache_key:contentHash};
}

function metadataText(s,lang){
  const title=lang==='vi'?s.vi:s.en;
  const code=lang==='vi'?`${s.viCode} (${s.code})`:s.code;
  return normalize(`${code}. ${title}. Pāli: ${s.pali}. Collection: ${s.collection}.`);
}

function makeDocument(s,lang){
  const title=lang==='vi'?s.vi:s.en;
  const parts=[metadataText(s,lang),s.summary[lang],s.practice[lang]].map(normalize).filter(Boolean);
  const text=parts.join('\n\n');
  return {document_id:`${s.id}:${lang}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,title,pali_title:s.pali,text,topics:s.topics,source_url:s.source.url,translator:s.source.translator,license:s.source.license,content_version:s.contentVersion,content_hash:`sha256:${sha(text)}`};
}

for(const lang of ['vi','en']){
  const chunks=[];const documents=[];
  for(const s of suttas){
    const summary=makeChunk(s,lang,'summary',s.summary[lang]);
    const practice=makeChunk(s,lang,'practice',s.practice[lang]);
    if(summary)chunks.push(summary);
    if(practice)chunks.push(practice);
    if(!summary&&!practice)chunks.push(makeChunk(s,lang,'catalog',metadataText(s,lang)));
    documents.push(makeDocument(s,lang));
  }
  writeFileSync(new URL(`nikaya-rag.${lang}.jsonl`,outDir),chunks.map(line).join('\n')+'\n');
  writeFileSync(new URL(`nikaya-knowledge.${lang}.jsonl`,outDir),documents.map(line).join('\n')+'\n');
  console.log(`Exported ${documents.length} ${lang} documents and ${chunks.length} non-empty RAG chunks.`);
}
