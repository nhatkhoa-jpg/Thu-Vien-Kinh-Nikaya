import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,ShieldCheck,Sparkles,Scale,TableProperties} from 'lucide-react';
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
  {ref:'Pháp Cú 354',text:'Pháp vị thắng mọi vị; pháp hỷ thắng mọi hỷ.',tone:'verseGold'}
];

export default async function LocaleHome({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SearchParams>}){
  const p=await params;if(!isLocale(p.locale))notFound();
  const locale=p.locale as Locale;const d=dict(locale);const vi=locale==='vi';
  const sp=await searchParams;const requested=typeof sp.collection==='string'?sp.collection:'ALL';
  const initialCollection=collections.some(c=>c.code===requested)?requested:'ALL';
  const featured=suttas.filter(s=>s.featured).slice(0,8);
  const heroItems=heroRefs.map((ref,i)=>suttas.find(s=>s.canonicalRef.toLowerCase()===ref)).filter(Boolean).map((s:any,i)=>({slug:s.slug,code:suttaDisplayCode(s,vi),intlCode:vi?s.code:undefined,title:vi?s.vi:s.en,summary:vi?(heroCopy[s.canonicalRef.toLowerCase()]||s.summaryVi):s.summaryEn,minutes:s.readMinutes,audio:Boolean(suttaAudio(s,locale)),collection:collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi),tone:heroTones[i%heroTones.length]}));
  const corpus=await getCorpusStats();const catalogAudioReady=suttas.filter(s=>Boolean(suttaAudio(s,locale))).length;const audioReady=Math.max(corpus.audioCount,catalogAudioReady);const numberLocale=vi?'vi-VN':'en-US';

  return <main className="homePage polishedHome">
    <section className="hero shell polishedHero"><div className="heroCopy"><div className="eyebrow">{vi?'THƯ VIỆN TAM TẠNG THERAVĀDA · ĐỌC & NGHE MIỄN PHÍ':'THERAVĀDA PĀLI CANON · READ & LISTEN FREE'}</div><h1>{vi?'Thư Viện Tam Tạng Pāli – Phật Giáo Theravāda':'Theravāda Pāli Canon Library'}</h1><p className="lede">{vi?'Kinh Tạng, Luật Tạng và Vi Diệu Pháp trong một không gian đọc yên tĩnh: tìm lời dạy, đọc toàn văn, nghe kinh và lưu lại để học lâu dài.':'Sutta, Vinaya and Abhidhamma in a calm library for reading, listening, reflection and long-term preservation.'}</p><div className="heroActions"><a className="btn btnPrimary" href="#library"><BookOpen size={18}/>{vi?'Tìm lời dạy':'Find a teaching'}</a><Link className="btn btnGhost" href={`/${locale}/tam-tang`}><TableProperties size={17}/>{vi?'Khám phá Tam Tạng':'Explore the Canon'}</Link></div><div className="heroStats" aria-label={vi?'Tổng quan thư viện':'Library overview'}><div><strong>3</strong><span>{vi?'Tạng kinh điển':'Piṭakas'}</span></div><div><strong>{corpus.canonicalCount.toLocaleString(numberLocale)}</strong><span>{vi?'mục kinh đã sắp xếp':'teachings organized'}</span></div><div><strong>{corpus.vietnameseFullTextCount.toLocaleString(numberLocale)}</strong><span>{vi?'bài đọc tiếng Việt':'Vietnamese readings'}</span></div><div><strong>{audioReady.toLocaleString(numberLocale)}</strong><span>{vi?'bài có audio':'entries with audio'}</span></div></div><div className="heroTrust"><ShieldCheck size={16}/><span>{vi?'Nguồn đối chiếu rõ ràng · Kinh văn không do AI tạo · Ưu tiên trải nghiệm đọc và học':'Traceable sources · No AI-generated scripture · Built for reading and practice'}</span></div></div>{vi?<ScriptureHeroRotator locale={locale} items={heroItems}/>:heroItems[0]&&<ScriptureHeroRotator locale={locale} items={heroItems}/>}</section>

    <section className="shell homeStartBand"><a href="#library"><span className="startIcon"><BookOpen size={20}/></span><span><strong>{vi?'Đọc & tra cứu':'Read & search'}</strong><small>{vi?'Tìm theo tên kinh, mã số, Pāli hoặc chủ đề':'Search by title, code, Pāli or topic'}</small></span><ArrowRight size={17}/></a><a href="#featured"><span className="startIcon"><Headphones size={20}/></span><span><strong>{vi?'Nghe kinh':'Listen'}</strong><small>{vi?'Nghe trên điện thoại và chỉnh tốc độ theo ý':'Play audio and change speed'}</small></span><ArrowRight size={17}/></a><Link href={`/${locale}/tien-do`}><span className="startIcon"><Activity size={20}/></span><span><strong>{vi?'Thư viện đang hoàn thiện':'Library progress'}</strong><small>{vi?'Xem những bộ nào đã sẵn sàng để đọc và nghe':'See what is ready to read and hear'}</small></span><ArrowRight size={17}/></Link></section>

    {vi?<div className="shell"><DhammapadaRotator verses={dhammapada.map(v=>({...v,href:`/${locale}?collection=KN#library`}))}/></div>:null}

    <section className="section shell" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{vi?'Khám phá 5 bộ kinh Nikāya':'Five Nikāya collections'}</h2><p>{vi?'Mỗi bộ có một cách sắp xếp và nhịp đọc riêng. Chọn bộ kinh bạn muốn học hôm nay.':'Each collection has its own structure and rhythm.'}</p></div></div><div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:c.descEn}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div></section>

    <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Tìm lời dạy bạn cần':'Search & browse'}</h2><p>{vi?'Tìm theo tên kinh, mã số, Pāli hoặc chủ đề; sau đó chọn bộ kinh hay những bài đã có audio.':'Search by title, code, Pāli or topic.'}</p></div></div><LibraryExplorer locale={locale} placeholder={vi?'Tìm tên kinh, mã số, Pāli hoặc chủ đề…':d.search} initialCollection={initialCollection}/></div></section>

    <section className="section shell" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{vi?'Mới cập nhật · đọc hoặc nghe ngay':d.featured}</h2><p>{vi?'Các bài nổi bật được đưa lên trang chủ để người đọc khám phá nhanh hơn.':d.featuredLead}</p></div></div><div className="featuredRail">{featured.map(s=>{const audio=suttaAudio(s,locale);return <Link className={`featuredCard collection-${s.collection.toLowerCase()}`} href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual"><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi)}</span><span>{audio?(vi?'CÓ AUDIO':'AUDIO'):`${s.readMinutes} ${d.minutes}`}</span></div><h3>{vi?s.vi:s.en}</h3><p>{s.pali}</p><div className="topicRow">{s.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}</div></div></Link>})}</div></section>

    <section className="shell homeTrustBand"><div><ShieldCheck size={22}/><span><strong>{vi?'Nguồn rõ ràng':'Traceable sources'}</strong><small>{vi?'Mỗi bài giữ thông tin nguồn để người đọc có thể đối chiếu khi cần.':'Source details remain available.'}</small></span></div><div><Sparkles size={22}/><span><strong>{vi?'Tôn trọng kinh văn':'Respect for scripture'}</strong><small>{vi?'AI chỉ hỗ trợ công cụ và nhận diện; không tạo lời kinh thay cho nguồn gốc.':'AI may assist the interface, not invent scripture.'}</small></span></div><div><Download size={22}/><span><strong>{vi?'Đọc và nghe lâu dài':'Read and listen long-term'}</strong><small>{vi?'Audio và tài liệu được chuẩn bị theo hướng có thể lưu giữ và dùng lại lâu dài.':'Prepared for durable preservation.'}</small></span></div></section>
    <footer><div className="shell footerInner"><div><strong>{vi?'Thư Viện Tam Tạng Pāli':d.brand}</strong><small>{vi?'Đọc · Nghe · Suy ngẫm · Lưu giữ':'Read · Listen · Reflect · Preserve'}</small></div><span>{d.footer}</span></div></footer>
  </main>;
}
