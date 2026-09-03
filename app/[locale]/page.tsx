import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,ShieldCheck,Sparkles,TableProperties} from 'lucide-react';
import {dict,isLocale,type Locale} from '@/lib/i18n';
import {homeUi} from '@/lib/home-copy';
import {publicUi} from '@/lib/public-ui';
import {collections,suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getCorpusStats} from '@/lib/corpus-stats';
import LibraryExplorer from '@/components/LibraryExplorer';
import {DhammapadaRotator,ScriptureHeroRotator} from '@/components/HomeRotators';
import {notFound} from 'next/navigation';

type SearchParams=Record<string,string|string[]|undefined>;
const heroRefs=['mn21','mn10','mn61','mn131','mn152'];
const heroCopy:Record<string,string>={mn21:'Kham nhẫn trước lời nói khó nghe, giữ tâm không sân và đứng vững giữa va chạm đời thường.',mn10:'Một bản đồ thực hành chánh niệm trực tiếp trên thân, thọ, tâm và pháp.',mn61:'Soi lại thân, khẩu, ý trước, trong và sau hành động để sống tỉnh thức hơn.',mn131:'Đừng chạy theo quá khứ hay mơ tưởng tương lai; học cách đứng vững với hiện tại.',mn152:'Tu tập các căn để không bị cảnh trần kéo tâm đi và nuôi lớn tự do nội tâm.'};
const heroTones=['toneEmerald','toneSaffron','toneIndigo','toneRuby','toneTeal'];
const dhammapada=[
{ref:'Pháp Cú 1',text:'Tâm dẫn đầu các pháp, tâm làm chủ, tâm tạo tác.',tone:'verseEmerald'},
{ref:'Pháp Cú 5',text:'Hận thù không thể dập tắt bằng hận thù; chỉ có không hận thù mới dập tắt được hận thù.',tone:'verseRuby'},
{ref:'Pháp Cú 21',text:'Không phóng dật là con đường bất tử; phóng dật là con đường chết.',tone:'verseIndigo'},
{ref:'Pháp Cú 50',text:'Không nên nhìn lỗi người, việc người làm hay không làm; hãy nhìn việc mình làm hay không làm.',tone:'verseSaffron'},
{ref:'Pháp Cú 160',text:'Tự mình là chỗ nương tựa cho chính mình; còn ai khác có thể là chỗ nương tựa?',tone:'verseTeal'},
{ref:'Pháp Cú 183',text:'Không làm các điều ác, siêng làm các điều lành, giữ tâm ý trong sạch.',tone:'verseGold'},
{ref:'Pháp Cú 204',text:'Sức khỏe là lợi tối thượng, biết đủ là tài sản tối thượng, Niết-bàn là an lạc tối thượng.',tone:'verseEmerald'},
{ref:'Pháp Cú 223',text:'Lấy không giận thắng giận, lấy thiện thắng không thiện, lấy bố thí thắng xan tham.',tone:'verseRuby'},
{ref:'Pháp Cú 276',text:'Các bậc Như Lai chỉ là người chỉ đường; chính các con phải nỗ lực.',tone:'verseIndigo'},
{ref:'Pháp Cú 354',text:'Pháp vị thắng mọi vị; pháp hỷ thắng mọi hỷ.',tone:'verseGold'}];

export default async function LocaleHome({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SearchParams>}){
 const p=await params;if(!isLocale(p.locale))notFound();const locale=p.locale as Locale;const d=dict(locale);const h=homeUi(locale);const u=publicUi(locale);const vi=locale==='vi';const en=locale==='en';
 const sp=await searchParams;const requested=typeof sp.collection==='string'?sp.collection:'ALL';const initialCollection=collections.some(c=>c.code===requested)?requested:'ALL';
 const featured=suttas.filter(s=>s.featured).slice(0,8);
 const foreignTitle=(s:any)=>vi?s.vi:en?s.en:(s.pali||s.code);
 const collectionTitle=(c:any)=>vi?c.vi:en?c.en:c.pali;
 const heroItems=heroRefs.map(ref=>suttas.find(s=>s.canonicalRef.toLowerCase()===ref)).filter(Boolean).map((s:any,i)=>({slug:s.slug,code:suttaDisplayCode(s,vi),intlCode:vi?s.code:undefined,title:foreignTitle(s),summary:vi?(heroCopy[s.canonicalRef.toLowerCase()]||s.summaryVi):en?s.summaryEn:h.lead,minutes:s.readMinutes,audio:Boolean(suttaAudio(s,locale)),collection:collectionTitle(collections.find(c=>c.code===s.collection)||{pali:s.collection,en:s.collection,vi:s.collection}),tone:heroTones[i%heroTones.length]}));
 const corpus=await getCorpusStats();const audioReady=Math.max(corpus.audioCount,suttas.filter(s=>Boolean(suttaAudio(s,locale))).length);const numberLocale=vi?'vi-VN':locale==='zh'?'zh-CN':locale==='th'?'th-TH':'en-US';
 return <main className="homePage polishedHome appHome">
   <section className="shell mobileWelcome"><div><span className="miniEyebrow">{h.eyebrow}</span><h1>{h.heading}</h1><p>{h.lead}</p></div><a className="quickSearch" href="#library"><BookOpen size={18}/><span>{h.find}</span><ArrowRight size={17}/></a></section>

   <section className="shell heroDiscovery">{heroItems[0]&&<ScriptureHeroRotator locale={locale} items={heroItems}/>}</section>

   <section className="shell appShortcuts" aria-label={h.shortcuts}>
    <a href="#library"><span><BookOpen size={20}/></span><strong>{h.search}</strong><small>{h.searchSub}</small></a>
    <Link href={`/${locale}/tam-tang`}><span><TableProperties size={20}/></span><strong>{h.canon}</strong><small>{h.canonSub}</small></Link>
    <a href="#featured"><span><Headphones size={20}/></span><strong>{h.listen}</strong><small>{audioReady.toLocaleString(numberLocale)} {h.listenSub}</small></a>
    <Link href={`/${locale}/tien-do`}><span><Activity size={20}/></span><strong>{h.updates}</strong><small>{h.updatesSub}</small></Link>
   </section>

   {vi?<div className="shell verseHome"><DhammapadaRotator verses={dhammapada.map(v=>({...v,href:`/${locale}?collection=KN#library`}))}/></div>:null}

   <section className="section shell compactCollectionSection" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{h.collections}</h2><p>{h.collectionsLead}</p></div></div><div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{collectionTitle(c)}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:en?c.descEn:h.collectionsLead}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div></section>

   <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{h.browse}</h2><p>{h.browseLead}</p></div></div><LibraryExplorer locale={locale} placeholder={h.placeholder} initialCollection={initialCollection}/></div></section>

   <section className="section shell" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{h.featured}</h2><p>{h.featuredLead}</p></div></div><div className="featuredRail">{featured.map(s=>{const audio=suttaAudio(s,locale);const c=collections.find(x=>x.code===s.collection);return <Link className={`featuredCard collection-${s.collection.toLowerCase()}`} href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual"><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{c?collectionTitle(c):collectionDisplayCode(s.collection,vi)}</span><span>{audio?h.audio:`${s.readMinutes} ${u.minutes}`}</span></div><h3>{foreignTitle(s)}</h3><p>{s.pali}</p><div className="topicRow">{(vi||en)?s.topics.slice(0,2).map(t=><span key={t}>{t}</span>):null}</div></div></Link>})}</div></section>

   <section className="shell librarySnapshot"><div><strong>{corpus.canonicalCount.toLocaleString(numberLocale)}</strong><span>{h.entries}</span></div><div><strong>{corpus.vietnameseFullTextCount.toLocaleString(numberLocale)}</strong><span>{h.viTexts}</span></div><div><strong>{audioReady.toLocaleString(numberLocale)}</strong><span>{h.audioEntries}</span></div></section>
   <section className="shell homeTrustBand"><div><ShieldCheck size={22}/><span><strong>{h.sources}</strong><small>{h.sourcesSub}</small></span></div><div><Sparkles size={22}/><span><strong>{h.respect}</strong><small>{h.respectSub}</small></span></div><div><Download size={22}/><span><strong>{h.durable}</strong><small>{h.durableSub}</small></span></div></section>
   <footer><div className="shell footerInner"><div><strong>{u.brand}</strong><small>{h.tagline}</small></div><span>{d.footer}</span></div></footer>
 </main>;
}
