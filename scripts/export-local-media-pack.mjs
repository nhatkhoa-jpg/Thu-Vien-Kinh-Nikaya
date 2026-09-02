import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const args=process.argv.slice(2);
const arg=(name,fallback)=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:fallback;};
const collection=String(arg('collection','DN')).toUpperCase();
const outRoot=resolve(arg('out','dist/local-media'));
const valid=new Set(['DN','MN','SN','AN','KN']);
if(!valid.has(collection))throw new Error(`Unsupported collection ${collection}`);

const root=resolve(new URL('..',import.meta.url).pathname);
const catalog=JSON.parse(readFileSync(join(root,'data/catalog/suttas.json'),'utf8'));
const contentDir=join(root,'data/content');
const materialized={};
function loadCorpus(dir){
  if(!existsSync(dir))return;
  for(const name of readdirSync(dir).sort()){
    const p=join(dir,name);const st=statSync(p);
    if(st.isDirectory())loadCorpus(p);
    else if(name.endsWith('.vi.json'))Object.assign(materialized,JSON.parse(readFileSync(p,'utf8')));
  }
}
loadCorpus(contentDir);

const normalize=text=>String(text??'').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
function isProvenanceSegment(segment){
  const id=String(segment?.id??'').toLowerCase();
  const text=normalize(segment?.text);
  const lower=text.toLowerCase();
  if(!text)return true;
  if(/(?:^|[-_.])(source|meta|metadata|provenance|credit|credits|license|translator)(?:$|[-_.])/.test(id))return true;
  if(lower.includes('prepared for suttacentral'))return true;
  if(lower.includes('suttacentral')&&(lower.includes('dịch')||lower.includes('translation')||lower.includes('prepared')||lower.includes('copyright')))return true;
  if(lower.includes('thích minh châu')&&(
    lower.includes('dịch sang việt ngữ')||lower.includes('phát hành')||lower.includes('tái bản')||lower.includes('ấn hành')||lower.includes('đại tạng kinh việt nam')
  ))return true;
  if((lower.includes('nhà xuất bản')||lower.includes('xuất bản năm')||lower.includes('bản dịch này'))&&(lower.includes('dịch giả')||lower.includes('phát hành')||lower.includes('tái bản')))return true;
  return false;
}
const bodyOf=record=>(record?.segments||[]).filter(s=>!isProvenanceSegment(s)).map(s=>normalize(s.text)).filter(Boolean).join('\n\n');
const sha=text=>createHash('sha256').update(text,'utf8').digest('hex');
const safe=s=>String(s).toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');

const rows=catalog.filter(s=>s.collection===collection);
if(!rows.length)throw new Error(`No catalog entries for ${collection}`);
const base=join(outRoot,collection.toLowerCase());
const ttsDir=join(base,'tts');const mp3Dir=join(base,'mp3');
mkdirSync(ttsDir,{recursive:true});mkdirSync(mp3Dir,{recursive:true});

const manifest=[];const combined=[];const ffconcat=['ffconcat version 1.0'];let missing=0,totalChars=0,removedSegments=0;
for(const s of rows){
  const record=materialized[s.canonicalRef];
  const allSegments=record?.segments||[];
  const removed=allSegments.filter(isProvenanceSegment).length;
  removedSegments+=removed;
  const body=bodyOf(record);
  const fileStem=safe(s.canonicalRef||s.code||s.id);
  if(!body){
    missing++;
    manifest.push({id:s.id,canonicalRef:s.canonicalRef,code:s.code,viCode:s.viCode,title:s.vi,status:'missing-fulltext'});
    continue;
  }
  const txtRel=`tts/${fileStem}.txt`;const mp3Rel=`mp3/${fileStem}.mp3`;
  writeFileSync(join(base,txtRel),body+'\n','utf8');
  combined.push(body);
  ffconcat.push(`file '${mp3Rel.replaceAll("'","'\\''")}'`);
  totalChars+=body.length;
  manifest.push({id:s.id,canonicalRef:s.canonicalRef,code:s.code,viCode:s.viCode,title:s.vi,pali:s.pali,status:'ready',textFile:txtRel,mp3File:mp3Rel,chars:body.length,sha256:sha(body),removedNonScriptureSegments:removed});
}

// Body-only by design: no translator/source/license/debug/provenance is fed to TTS.
writeFileSync(join(base,`${collection.toLowerCase()}.body-only.txt`),combined.join('\n\n\n')+'\n','utf8');
writeFileSync(join(base,'concat.ffconcat'),ffconcat.join('\n')+'\n','utf8');
writeFileSync(join(base,'manifest.json'),JSON.stringify({schemaVersion:1,collection,generatedAt:new Date().toISOString(),catalogCount:rows.length,readyCount:manifest.length-missing,missingCount:missing,totalChars,removedNonScriptureSegments:removedSegments,ttsPolicy:'body-only; excludes source, translator, license, provenance, summaries, practice notes and UI text',items:manifest},null,2)+'\n','utf8');
writeFileSync(join(base,'README.txt'),[
  `${collection} local media pack`,
  '',
  'tts/*.txt = one discourse per file, BODY ONLY.',
  `${collection.toLowerCase()}.body-only.txt = all available discourse bodies in canonical catalog order.`,
  'mp3/ = place rendered per-discourse MP3 files here using manifest names.',
  'concat.ffconcat = ffmpeg concat list for a whole-collection MP3.',
  '',
  `Render ready: ${manifest.length-missing}/${rows.length}`,
  `Missing full text: ${missing}`,
  `Removed non-scripture/provenance segments: ${removedSegments}`,
  `Total TTS characters: ${totalChars}`,
  '',
  `After rendering: ffmpeg -f concat -safe 0 -i concat.ffconcat -c copy ${collection.toLowerCase()}-complete.mp3`,
].join('\n')+'\n','utf8');

console.log(JSON.stringify({collection,catalogCount:rows.length,readyCount:manifest.length-missing,missingCount:missing,removedNonScriptureSegments:removedSegments,totalChars,out:base}));
if(manifest.length-missing===0)process.exitCode=2;
