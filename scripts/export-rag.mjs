import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const suttas=JSON.parse(readFileSync(new URL('../data/catalog/suttas.json',import.meta.url),'utf8'));
const outDir=new URL('../data/exports/',import.meta.url);
mkdirSync(outDir,{recursive:true});

const normalize=text=>text.replace(/\s+/g,' ').trim();
const sha=text=>createHash('sha256').update(normalize(text),'utf8').digest('hex');
const line=obj=>JSON.stringify(obj);

function makeChunk(s,lang,section,text){
  const title=lang==='vi'?s.vi:s.en;
  const contentHash=`sha256:${sha(text)}`;
  return {chunk_id:`${s.id}:${lang}:${section}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,section,title,pali_title:s.pali,text,topics:s.topics,source_url:s.source.url,source_provider:s.source.provider,translator:s.source.translator,license:s.source.license,content_version:s.contentVersion,content_hash:contentHash,embedding_cache_key:contentHash};
}

function makeDocument(s,lang){
  const title=lang==='vi'?s.vi:s.en;
  const text=`${title}\n\n${s.summary[lang]}\n\n${s.practice[lang]}`;
  return {document_id:`${s.id}:${lang}:v1`,sutta_id:s.id,canonical_ref:s.canonicalRef,collection:s.collection,code:s.code,vi_code:s.viCode,language:lang,title,pali_title:s.pali,text,topics:s.topics,source_url:s.source.url,translator:s.source.translator,license:s.source.license,content_version:s.contentVersion,content_hash:`sha256:${sha(text)}`};
}

for(const lang of ['vi','en']){
  const chunks=[];const documents=[];
  for(const s of suttas){chunks.push(makeChunk(s,lang,'summary',s.summary[lang]));chunks.push(makeChunk(s,lang,'practice',s.practice[lang]));documents.push(makeDocument(s,lang));}
  writeFileSync(new URL(`nikaya-rag.${lang}.jsonl`,outDir),chunks.map(line).join('\n')+'\n');
  writeFileSync(new URL(`nikaya-knowledge.${lang}.jsonl`,outDir),documents.map(line).join('\n')+'\n');
}
console.log(`Exported ${suttas.length} documents and ${suttas.length*2} RAG chunks per language.`);
