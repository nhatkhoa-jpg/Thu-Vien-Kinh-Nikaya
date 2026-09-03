import Link from 'next/link';
import {ArrowRight,BookOpen,Headphones,Download,ShieldCheck,Sparkles,TableProperties} from 'lucide-react';
import {dict,isLocale,type Locale} from '@/lib/i18n';
import {collections,suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getCorpusStats} from '@/lib/corpus-stats';
import {homeUi} from '@/lib/home-ui';
import LibraryExplorer from '@/components/LibraryExplorer';
import {DhammapadaRotator,ScriptureHeroRotator} from '@/components/HomeRotators';
import {notFound} from 'next/navigation';

type SearchParams=Record<string,string|string[]|undefined>;
const heroRefs=['mn21','mn10','mn61','mn131','mn152'];
const heroCopy:Record<string,string>={mn21:'Kham nhẫn trước lời nói khó nghe, giữ tâm không sân và đứng vững giữa va chạm đời thường.',mn10:'Một bản đồ thực hành chánh niệm trực tiếp trên thân, thọ, tâm và pháp.',mn61:'Soi lại thân, khẩu, ý trước, trong và sau hành động để sống tỉnh thức hơn.',mn131:'Đừng chạy theo quá khứ hay mơ tưởng tương lai; học cách đứng vững với hiện tại.',mn152:'Tu tập các căn để không bị cảnh trần kéo tâm đi và nuôi lớn tự do nội tâm.'};
const heroTones=['toneEmerald','toneSaffron','toneIndigo','toneRuby','toneTeal'];
const visualSet=['/visuals/buddha-library.svg','/visuals/palm-leaf-manuscript.svg','/visuals/bodhi-dharma.svg','/visuals/buddha-library.svg','/visuals/palm-leaf-manuscript.svg'];
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
 const p=await params;if(!isLocale(p.locale))notFound();const locale=p.locale as Locale;const d=dict(locale);const h=homeUi(locale);const vi=locale==='vi';const en=locale==='en';
 const sp=await searchParams;const requested=typeof sp.collection==='string'?sp.collection:'ALL';const initialCollection=collections.some(c=>c.code===requested)?requested:'ALL';
 const featured=suttas.filter(s=>s.featured).slice(0,8);
 const localTitle=(s:any)=>vi?s.vi:en?s.en:(s.pali||s.code);
 const localCollection=(code:string)=>h.collectionNames[code]||collectionDisplayCode(code,vi);
 const heroItems=heroRefs.map(ref=>suttas.find(s=>s.canonicalRef.toLowerCase()===ref)).filter(Boolean).map((s:any,i)=>({slug:s.slug,code:suttaDisplayCode(s,vi),intlCode:vi?s.code:undefined,title:localTitle(s),summary:vi?(heroCopy[s.canonicalRef.toLowerCase()]||s.summaryVi):en?s.summaryEn:h.genericSummary,minutes:s.readMinutes,audio:Boolean(suttaAudio(s,locale)),collection:localCollection(s.collection),tone:heroTones[i%heroTones.length],image:visualSet[i%visualSet.length]}));
 const corpus=await getCorpusStats();const audioReady=Math.max(corpus.audioCount,suttas.filter(s=>Boolean(suttaAudio(s,locale))).length);const numberLocale=locale==='vi'?'vi-VN':locale==='zh'?'zh-CN':locale==='th'?'th-TH':'en-US';
 return <main className="homePage polishedHome appHome visualHomeV2 buddhistHome">
   <section className="shell mobileWelcome buddhistWelcome"><div><span className="miniEyebrow">{h.eyebrow}</span><h1>{h.title}</h1><p>{h.lead}</p></div><a className="quickSearch" href="#library"><BookOpen size={18}/><span>{h.find}</span><ArrowRight size={17}/></a></section>

   <section className="shell sacredVisualStrip" aria-hidden="true"><div className="sacredVisual sacredBuddha"/><div className="sacredVisual sacredBook"/><div className="sacredVisual sacredBodhi"/></section>

   <section className="shell heroDiscovery">{heroItems[0]&&<ScriptureHeroRotator locale={locale} items={heroItems} copy={h}/>}</section>

   <section className="shell appShortcuts fiveShortcuts" aria-label={h.exploreTitle}>
    <Link href={`/${locale}/tam-tang`}><span><BookOpen size={20}/></span><strong>{h.sutta}</strong><small>{h.suttaSub}</small></Link>
    <Link href={`/${locale}/tam-tang`}><span><ShieldCheck size={20}/></span><strong>{h.vinaya}</strong><small>{h.vinayaSub}</small></Link>
    <Link href={`/${locale}/tam-tang`}><span><Sparkles size={20}/></span><strong>{h.abhidhamma}</strong><small>{h.abhidhammaSub}</small></Link>
    <a href="#collections"><span><TableProperties size={20}/></span><strong>{h.five}</strong><small>{corpus.canonicalCount.toLocaleString(numberLocale)} {h.entries}</small></a>
    <a href="#featured"><span><Headphones size={20}/></span><strong>{h.listen}</strong><small>{audioReady.toLocaleString(numberLocale)} {h.withAudio}</small></a>
   </section>

   {vi?<div className="shell verseHome"><DhammapadaRotator verses={dhammapada.map(v=>({...v,href:`/${locale}?collection=KN#library`}))}/></div>:null}

   <section className="section shell compactCollectionSection" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{h.exploreTitle}</h2><p>{h.exploreLead}</p></div></div><div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{h.collectionNames[c.code]||localCollection(c.code)}</h3><p className="pali">{c.pali}</p><p>{h.collectionDescs[c.code]||''}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div></section>

   <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{h.searchTitle}</h2><p>{h.searchLead}</p></div></div><LibraryExplorer locale={locale} placeholder={d.search} initialCollection={initialCollection}/></div></section>

   <section className="section shell latestVisualSection" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{h.featuredTitle}</h2><p>{h.featuredLead}</p></div><Link className="sectionMore" href={`/${locale}/tien-do`}>{h.progress} <ArrowRight size={16}/></Link></div><div className="featuredRail">{featured.map((s,i)=>{const audio=suttaAudio(s,locale);return <Link className={`featuredCard visualFeaturedCard collection-${s.collection.toLowerCase()}`} href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual" style={{backgroundImage:`linear-gradient(180deg,rgba(12,33,28,.03),rgba(12,33,28,.5)),url(${visualSet[i%visualSet.length]})`}}><span className="newPill">{h.newLabel}</span><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{localCollection(s.collection)}</span><span>{audio?h.audioLabel:`${s.readMinutes} ${h.minutes}`}</span></div><h3>{localTitle(s)}</h3><p>{s.pali||h.fullText}</p></div></Link>})}</div></section>

   <section className="shell librarySnapshot"><div><strong>{corpus.canonicalCount.toLocaleString(numberLocale)}</strong><span>{h.organized}</span></div><div><strong>{corpus.vietnameseFullTextCount.toLocaleString(numberLocale)}</strong><span>{h.vietnameseTexts}</span></div><div><strong>{audioReady.toLocaleString(numberLocale)}</strong><span>{h.audioEntries}</span></div></section>
   <section className="shell homeTrustBand"><div><ShieldCheck size={22}/><span><strong>{h.traceable}</strong><small>{h.traceableSub}</small></span></div><div><Sparkles size={22}/><span><strong>{h.respect}</strong><small>{h.respectSub}</small></span></div><div><Download size={22}/><span><strong>{h.preserve}</strong><small>{h.preserveSub}</small></span></div></section>
 </main>;
}
