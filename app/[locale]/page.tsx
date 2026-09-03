import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,ShieldCheck,Sparkles,TableProperties} from 'lucide-react';
import {dict,isLocale,type Locale} from '@/lib/i18n';
import {collections,suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getCorpusStats} from '@/lib/corpus-stats';
import LibraryExplorer from '@/components/LibraryExplorer';
import {DhammapadaRotator,ScriptureHeroRotator} from '@/components/HomeRotators';
import {notFound} from 'next/navigation';

type SearchParams=Record<string,string|string[]|undefined>;
const heroRefs=['mn21','mn10','mn61','mn131','mn152'];
const heroCopy:Record<string,string>={mn21:'Kham nhẫn trước lời nói khó nghe, giữ tâm không sân và đứng vững giữa va chạm đời thường.',mn10:'Một bản đồ thực hành chánh niệm trực tiếp trên thân, thọ, tâm và pháp.',mn61:'Soi lại thân, khẩu, ý trước, trong và sau hành động để sống tỉnh thức hơn.',mn131:'Đừng chạy theo quá khứ hay mơ tưởng tương lai; học cách đứng vững với hiện tại.',mn152:'Tu tập các căn để không bị cảnh trần kéo tâm đi và nuôi lớn tự do nội tâm.'};
const heroTones=['toneEmerald','toneSaffron','toneIndigo','toneRuby','toneTeal'];
const visualSet=['/visuals/hero-dawn.svg','/visuals/hero-lotus.svg','/visuals/hero-forest.svg','/visuals/hero-river.svg','/visuals/hero-temple.svg'];
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
 const p=await params;if(!isLocale(p.locale))notFound();const locale=p.locale as Locale;const d=dict(locale);const vi=locale==='vi';
 const sp=await searchParams;const requested=typeof sp.collection==='string'?sp.collection:'ALL';const initialCollection=collections.some(c=>c.code===requested)?requested:'ALL';
 const featured=suttas.filter(s=>s.featured).slice(0,8);
 const heroItems=heroRefs.map(ref=>suttas.find(s=>s.canonicalRef.toLowerCase()===ref)).filter(Boolean).map((s:any,i)=>({slug:s.slug,code:suttaDisplayCode(s,vi),intlCode:vi?s.code:undefined,title:vi?s.vi:s.en,summary:vi?(heroCopy[s.canonicalRef.toLowerCase()]||s.summaryVi):s.summaryEn,minutes:s.readMinutes,audio:Boolean(suttaAudio(s,locale)),collection:collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi),tone:heroTones[i%heroTones.length],image:visualSet[i%visualSet.length]}));
 const corpus=await getCorpusStats();const audioReady=Math.max(corpus.audioCount,suttas.filter(s=>Boolean(suttaAudio(s,locale))).length);const numberLocale=vi?'vi-VN':'en-US';
 return <main className="homePage polishedHome appHome visualHomeV2">
   <section className="shell mobileWelcome"><div><span className="miniEyebrow">{vi?'THƯ VIỆN TAM TẠNG PĀLI · ĐỌC & NGHE':'PĀLI CANON · READ & LISTEN'}</span><h1>{vi?'Một thư viện để muốn mở ra mỗi ngày.':'A library worth opening every day.'}</h1><p>{vi?'Kinh văn có nguồn rõ ràng, trình bày sống động vừa đủ để đọc lâu mà không mỏi mắt.':'Source-backed scripture in a calm, inviting reading experience.'}</p></div><a className="quickSearch" href="#library"><BookOpen size={18}/><span>{vi?'Tìm kinh ngay':'Find a sutta'}</span><ArrowRight size={17}/></a></section>

   <section className="shell heroDiscovery">{heroItems[0]&&<ScriptureHeroRotator locale={locale} items={heroItems}/>}</section>

   <section className="shell appShortcuts fiveShortcuts" aria-label={vi?'Lối tắt thư viện':'Library shortcuts'}>
    <Link href={`/${locale}/tam-tang`}><span><BookOpen size={20}/></span><strong>{vi?'Kinh Tạng':'Sutta'}</strong><small>{vi?'Lời dạy & đối thoại':'Discourses'}</small></Link>
    <Link href={`/${locale}/tam-tang`}><span><ShieldCheck size={20}/></span><strong>{vi?'Luật Tạng':'Vinaya'}</strong><small>{vi?'Đời sống & giới luật':'Monastic law'}</small></Link>
    <Link href={`/${locale}/tam-tang`}><span><Sparkles size={20}/></span><strong>{vi?'Vi Diệu Pháp':'Abhidhamma'}</strong><small>{vi?'Phân tích các pháp':'Analysis'}</small></Link>
    <a href="#collections"><span><TableProperties size={20}/></span><strong>{vi?'5 Nikāya':'5 Nikāyas'}</strong><small>{corpus.canonicalCount.toLocaleString(numberLocale)} {vi?'mục':'entries'}</small></a>
    <a href="#featured"><span><Headphones size={20}/></span><strong>{vi?'Nghe kinh':'Listen'}</strong><small>{audioReady.toLocaleString(numberLocale)} {vi?'bài có audio':'with audio'}</small></a>
   </section>

   {vi?<div className="shell verseHome"><DhammapadaRotator verses={dhammapada.map(v=>({...v,href:`/${locale}?collection=KN#library`}))}/></div>:null}

   <section className="section shell compactCollectionSection" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{vi?'Khám phá 5 bộ Nikāya':'Explore the five Nikāyas'}</h2><p>{vi?'Mỗi bộ có một sắc thái riêng, nhưng vẫn nằm trong cùng một hệ thống đọc yên tĩnh.':'A calm path into each collection.'}</p></div></div><div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:c.descEn}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div></section>

   <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Tìm lời dạy bạn cần':'Search & browse'}</h2><p>{vi?'Tìm theo tên kinh, mã số, Pāli hoặc chủ đề.':'Search by title, code, Pāli or topic.'}</p></div></div><LibraryExplorer locale={locale} placeholder={vi?'Tìm tên kinh, mã số, Pāli hoặc chủ đề…':d.search} initialCollection={initialCollection}/></div></section>

   <section className="section shell latestVisualSection" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{vi?'Mới cập nhật · đọc hoặc nghe ngay':d.featured}</h2><p>{vi?'Các bài vừa được cập nhật trong corpus được đưa lên đây để nhìn thấy ngay.':d.featuredLead}</p></div><Link className="sectionMore" href={`/${locale}/tien-do`}>{vi?'Xem tiến độ':'Progress'} <ArrowRight size={16}/></Link></div><div className="featuredRail">{featured.map((s,i)=>{const audio=suttaAudio(s,locale);return <Link className={`featuredCard visualFeaturedCard collection-${s.collection.toLowerCase()}`} href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual" style={{backgroundImage:`linear-gradient(180deg,rgba(12,33,28,.03),rgba(12,33,28,.42)),url(${visualSet[i%visualSet.length]})`}}><span className="newPill">{vi?'MỚI':'NEW'}</span><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi)}</span><span>{audio?(vi?'CÓ AUDIO':'AUDIO'):`${s.readMinutes} ${d.minutes}`}</span></div><h3>{vi?s.vi:s.en}</h3><p>{s.pali|| (vi?'Bản kinh có nguồn đối chiếu':'Source-backed text')}</p><div className="topicRow">{s.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}</div></div></Link>})}</div></section>

   <section className="shell librarySnapshot"><div><strong>{corpus.canonicalCount.toLocaleString(numberLocale)}</strong><span>{vi?'mục kinh đã sắp xếp':'organized entries'}</span></div><div><strong>{corpus.vietnameseFullTextCount.toLocaleString(numberLocale)}</strong><span>{vi?'bài đọc tiếng Việt':'Vietnamese texts'}</span></div><div><strong>{audioReady.toLocaleString(numberLocale)}</strong><span>{vi?'bài có audio':'audio entries'}</span></div></section>
   <section className="shell homeTrustBand"><div><ShieldCheck size={22}/><span><strong>{vi?'Nguồn rõ ràng':'Traceable sources'}</strong><small>{vi?'Mỗi bài giữ thông tin nguồn để đối chiếu khi cần.':'Source details remain available.'}</small></span></div><div><Sparkles size={22}/><span><strong>{vi?'Tôn trọng kinh văn':'Respect for scripture'}</strong><small>{vi?'AI không thay thế lời kinh từ nguồn gốc.':'AI does not invent scripture.'}</small></span></div><div><Download size={22}/><span><strong>{vi?'Đọc và nghe lâu dài':'Read and listen long-term'}</strong><small>{vi?'Tài liệu được chuẩn bị để lưu giữ bền vững.':'Prepared for durable preservation.'}</small></span></div></section>
 </main>;
}
