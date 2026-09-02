import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';

const base=(process.argv[2]||'').replace(/\/$/,'');
if(!/^https:\/\//.test(base))throw new Error('Expected deployed HTTPS base URL');
const catalog=JSON.parse(readFileSync(new URL('../data/catalog/suttas.json',import.meta.url),'utf8'));
const byRef=ref=>{const row=catalog.find(x=>x.canonicalRef===ref);if(!row)throw new Error(`Missing smoke canonicalRef=${ref}`);return row;};
const range=catalog.find(x=>x.collection==='SN'&&x.canonicalRef.includes('-'));
if(!range)throw new Error('Missing canonical range smoke fixture');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function http(path,expected=200){
  let lastError;
  for(let attempt=1;attempt<=24;attempt++){
    try{
      const response=await fetch(`${base}${path}`,{redirect:'follow'});
      if(response.status===expected)return response.text();
      if((response.status>=500||response.status===429)&&attempt<24){
        lastError=new Error(`${path}: transient HTTP ${response.status}`);
        console.log(`Waiting for workers.dev propagation: ${path} returned ${response.status} (attempt ${attempt}/24)`);
        await sleep(5000);
        continue;
      }
      throw new Error(`${path}: expected ${expected}, got ${response.status}`);
    }catch(error){
      lastError=error;
      if(attempt>=24)break;
      console.log(`Waiting for workers.dev TLS/DNS propagation: ${path} network error (attempt ${attempt}/24)`);
      await sleep(5000);
    }
  }
  throw new Error(`${path}: preview did not become reachable after retry window`,{cause:lastError});
}

for(const locale of ['vi','en','th','my','si','km','lo','zh'])await http(`/${locale}`);
const robots=await http('/robots.txt');if(!robots.includes('sitemap.xml'))throw new Error('robots.txt missing sitemap');
const sitemap=await http('/sitemap.xml');if(!sitemap.includes('<urlset'))throw new Error('sitemap.xml invalid');
await http('/not-a-real-route',404);
for(const ref of ['dn1','mn21','sn1.1',range.canonicalRef]){
  const row=byRef(ref);const html=await http(`/vi/library/${row.slug}`);
  if(!html.includes(row.pali))throw new Error(`Reader missing Pali title canonicalRef=${ref}`);
  if(!html.includes('SuttaCentral'))throw new Error(`Reader missing provenance canonicalRef=${ref}`);
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const consoleErrors=[];
page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
page.on('pageerror',error=>consoleErrors.push(error.message));
for(const [locale,marker] of [['th','ไทย'],['my','မြန်မာ'],['si','සිංහල'],['km','ខ្មែរ'],['lo','ລາວ']]){
  await page.goto(`${base}/${locale}`,{waitUntil:'networkidle'});
  if(!(await page.locator('body').innerText()).includes(marker))throw new Error(`Unicode marker missing locale=${locale}`);
  if(await page.locator('.suttaCard').count()>60)throw new Error(`Too many initial cards locale=${locale}`);
}

await page.goto(`${base}/vi`,{waitUntil:'networkidle'});
const cards=page.locator('.suttaCard');
if(await cards.count()!==60)throw new Error(`Expected 60 initial cards, got ${await cards.count()}`);
if(!await page.locator('.loadMoreRow button').isVisible())throw new Error('Load-more button missing');
await page.locator('input[aria-label="search"]').fill('DN 1');await page.waitForTimeout(200);
if(await cards.count()<1)throw new Error('Canonical search returned no result');
await page.locator('input[aria-label="search"]').fill('');
await page.getByRole('button',{name:/Trường Bộ/}).click();await page.waitForTimeout(150);
if(await cards.count()<1||await cards.count()>60)throw new Error('Collection filtering failed');

const mn=byRef('mn21');
await page.goto(`${base}/vi/library/${mn.slug}`,{waitUntil:'networkidle'});
await page.locator('details.primaryMp3Disclosure summary').click();
if(!await page.locator('audio').isVisible())throw new Error('MP3 player missing');
if(await page.locator('.rateGroup button').count()!==6)throw new Error('Playback speeds missing');
if(!(await page.locator('body').innerHTML()).includes('mn21.manifest.json'))throw new Error('Segmented manifest fallback missing');
if(!await page.locator('details.pdfDisclosure summary').isVisible())throw new Error('PDF control missing');
if(!await page.locator('.readerProgress').count())throw new Error('Reader progress missing');

const hydrationErrors=consoleErrors.filter(x=>/hydration|uncaught|typeerror|referenceerror/i.test(x));
await browser.close();
if(hydrationErrors.length)throw new Error(`Browser errors: ${hydrationErrors.join(' | ')}`);
console.log(JSON.stringify({base,locales:8,readers:['dn1','mn21','sn1.1',range.canonicalRef],mobile:true,status:'PASS'}));
