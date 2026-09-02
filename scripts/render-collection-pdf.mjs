import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const args=process.argv.slice(2);
const arg=(name,fallback)=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:fallback;};
const collection=String(arg('collection','DN')).toUpperCase();
const packRoot=resolve(arg('pack','dist/local-media'));
const base=join(packRoot,collection.toLowerCase());
const manifestPath=join(base,'manifest.json');
if(!existsSync(manifestPath))throw new Error(`Missing ${manifestPath}; run export-local-media-pack.mjs first.`);
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const ready=manifest.items.filter(x=>x.status==='ready'&&x.textFile);
if(!ready.length)throw new Error(`No materialized ${collection} full text available for PDF.`);

const names={DN:'Trường Bộ Kinh',MN:'Trung Bộ Kinh',SN:'Tương Ưng Bộ Kinh',AN:'Tăng Chi Bộ Kinh',KN:'Tiểu Bộ Kinh'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paras=text=>String(text).split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const toc=ready.map((x,i)=>`<li><span>${i+1}. ${esc(x.viCode||x.code)} · ${esc(x.title)}</span><span class="pali">${esc(x.pali||'')}</span></li>`).join('');
const chapters=ready.map((x,i)=>{
  const body=readFileSync(join(base,x.textFile),'utf8').trim();
  return `<article class="sutta"><header><div class="num">${i+1}</div><div><div class="code">${esc(x.viCode||x.code)} · ${esc(x.code)}</div><h2>${esc(x.title)}</h2>${x.pali?`<div class="pali">${esc(x.pali)}</div>`:''}</div></header><div class="body">${paras(body)}</div></article>`;
}).join('\n');

const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
@page{size:A4;margin:20mm 18mm 22mm}*{box-sizing:border-box}body{margin:0;color:#17221c;font-family:Georgia,'Times New Roman',serif;font-size:12.2pt;line-height:1.72}.cover{height:245mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:always}.cover .eyebrow{font:700 10pt Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8c6426}.cover h1{font-size:34pt;line-height:1.08;margin:14mm 0 5mm}.cover p{max-width:125mm;color:#5f6862}.toc{page-break-after:always}.toc h1{font-size:25pt}.toc ol{padding-left:0;list-style:none}.toc li{padding:3mm 0;border-bottom:.2mm solid #ddd;display:flex;justify-content:space-between;gap:8mm}.toc .pali{font-size:9.5pt;color:#68736c;text-align:right}.sutta{page-break-before:always}.sutta header{display:flex;gap:5mm;align-items:flex-start;border-bottom:.4mm solid #d8d5cd;padding-bottom:5mm;margin-bottom:8mm}.num{width:12mm;height:12mm;border-radius:3mm;background:#1e5a45;color:white;display:flex;align-items:center;justify-content:center;font:700 9pt Arial,sans-serif}.code{font:700 9pt Arial,sans-serif;color:#9a6826;letter-spacing:.06em}.sutta h2{font-size:23pt;line-height:1.15;margin:2mm 0}.pali{font-style:italic;color:#68736c}.body p{margin:0 0 4.5mm;text-align:justify;orphans:3;widows:3}.credits{page-break-before:always;font-family:Arial,sans-serif;font-size:10pt;color:#56615a}.credits h2{font-family:Georgia,serif;color:#17221c}.credits code{font-size:8.5pt;word-break:break-all}
</style></head><body>
<section class="cover"><div class="eyebrow">THƯ VIỆN 5 ĐẠI TẠNG KINH NIKĀYA</div><h1>${esc(names[collection]||collection)}</h1><p>Bản PDF tổng hợp từ kinh văn tiếng Việt đã được materialize trong thư viện. Nội dung từng bài giữ theo thứ tự kinh điển của catalog.</p><p><strong>${ready.length}</strong> mục kinh có toàn văn trong bản xuất này.</p></section>
<section class="toc"><h1>Mục lục</h1><ol>${toc}</ol></section>
${chapters}
<section class="credits"><h2>Thông tin bản số hóa</h2><p>PDF này là bản đóng gói phục vụ đọc offline. Thông tin nguồn, dịch giả và quyền sử dụng của từng bài được quản lý trong catalog/provenance của Thư viện 5 Đại Tạng Kinh Nikāya; phần kinh văn không bị trộn với dữ liệu kỹ thuật.</p><p>Manifest SHA-256 đi kèm: <code>manifest.json</code>.</p></section>
</body></html>`;

const htmlPath=join(base,`${collection.toLowerCase()}-complete.html`);
const pdfPath=resolve(arg('pdf',join(base,`${collection.toLowerCase()}-complete.pdf`)));
await mkdir(dirname(pdfPath),{recursive:true});
writeFileSync(htmlPath,html,'utf8');
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.goto(`file://${htmlPath}`,{waitUntil:'load'});
  await page.pdf({path:pdfPath,format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="font-size:8px;color:#777;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin:{top:'20mm',bottom:'22mm',left:'18mm',right:'18mm'}});
}finally{await browser.close();}
console.log(JSON.stringify({collection,pdf:pdfPath,items:ready.length}));
