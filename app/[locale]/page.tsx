import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,Clock,Play,ShieldCheck,Sparkles,Scale,TableProperties} from 'lucide-react';
import {dict,isLocale,type Locale} from '@/lib/i18n';
import {collections,suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getCorpusStats} from '@/lib/corpus-stats';
import LibraryExplorer from '@/components/LibraryExplorer';
import {notFound} from 'next/navigation';

type SearchParams=Record<string,string|string[]|undefined>;

export default async function LocaleHome({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<SearchParams>}){
  const p=await params;if(!isLocale(p.locale))notFound();
  const locale=p.locale as Locale;const d=dict(locale);const vi=locale==='vi';
  const sp=await searchParams;const requested=typeof sp.collection==='string'?sp.collection:'ALL';
  const initialCollection=collections.some(c=>c.code===requested)?requested:'ALL';
  const featured=suttas.filter(s=>s.featured).slice(0,6);
  const heroSutta=suttas.find(s=>s.slug==='mn-21-kakacupama')!;const heroAudio=suttaAudio(heroSutta,locale);
  const corpus=await getCorpusStats();
  const catalogAudioReady=suttas.filter(s=>Boolean(suttaAudio(s,locale))).length;
  const audioReady=Math.max(corpus.audioCount,catalogAudioReady);
  const numberLocale=vi?'vi-VN':'en-US';

  return <main className="homePage polishedHome">
    <section className="hero shell polishedHero">
      <div className="heroCopy">
        <div className="eyebrow">{vi?'THƯ VIỆN TAM TẠNG THERAVĀDA · ĐỌC & NGHE MIỄN PHÍ':'THERAVĀDA PĀLI CANON · READ & LISTEN FREE'}</div>
        <h1>{vi?'Thư Viện Tam Tạng Pāli – Phật Giáo Theravāda':'Theravāda Pāli Canon Library'}</h1>
        <p className="lede">{vi?'Kinh Tạng, Luật Tạng và Vi Diệu Pháp trong một không gian đọc yên tĩnh: tìm lời dạy, đọc toàn văn, nghe kinh và lưu lại để học lâu dài.':'Sutta, Vinaya and Abhidhamma in a calm library for reading, listening, reflection and long-term preservation.'}</p>
        <div className="heroActions">
          <a className="btn btnPrimary" href="#library"><BookOpen size={18}/>{vi?'Tìm lời dạy':'Find a teaching'}</a>
          <Link className="btn btnGhost" href={`/${locale}/tam-tang`}><TableProperties size={17}/>{vi?'Khám phá Tam Tạng':'Explore the Canon'}</Link>
        </div>
        <div className="heroStats" aria-label={vi?'Tổng quan thư viện':'Library overview'}>
          <div><strong>3</strong><span>{vi?'Tạng kinh điển':'Piṭakas'}</span></div>
          <div><strong>{corpus.canonicalCount.toLocaleString(numberLocale)}</strong><span>{vi?'mục kinh đã sắp xếp':'teachings organized'}</span></div>
          <div><strong>{corpus.vietnameseFullTextCount.toLocaleString(numberLocale)}</strong><span>{vi?'bài đọc tiếng Việt':'Vietnamese readings'}</span></div>
          <div><strong>{audioReady.toLocaleString(numberLocale)}</strong><span>{vi?'bài có audio':'entries with audio'}</span></div>
        </div>
        <div className="heroTrust"><ShieldCheck size={16}/><span>{vi?'Nguồn đối chiếu rõ ràng · Kinh văn không do AI tạo · Ưu tiên trải nghiệm đọc và học':'Traceable sources · No AI-generated scripture · Built for reading and practice'}</span></div>
      </div>
      <aside className="heroFocus">
        <div className="heroFocusTop"><span className="focusBadge dualCode"><strong>{suttaDisplayCode(heroSutta,vi)}</strong>{vi&&<small>{heroSutta.code}</small>}</span><span className="miniMeta"><Clock size={14}/>{heroSutta.readMinutes} {d.minutes}</span></div>
        <div><p className="kicker">{vi?'MỘT BÀI KINH ĐỂ BẮT ĐẦU':'SUGGESTED READING'}</p><h2>{vi?heroSutta.vi:heroSutta.en}</h2><p>{vi?'Kham nhẫn trước lời nói khó nghe, giữ tâm không sân và học cách đứng vững giữa va chạm đời thường.':'Patience, difficult speech, and keeping a mind free from hate.'}</p></div>
        <Link className="focusAction" href={`/${locale}/library/${heroSutta.slug}`}><span className="playCircle"><Play size={18} fill="currentColor"/></span><span><strong>{vi?'Mở bài kinh':'Open discourse'}</strong><small>{heroAudio?(vi?'Có audio · nghe ngay trên trang':'Audio available'):(vi?'Đọc toàn văn ngay trên trang':'Read the full text here')}</small></span><ArrowRight size={18}/></Link>
      </aside>
    </section>

    <section className="shell homeStartBand" aria-label={vi?'Bắt đầu sử dụng thư viện':'Start using the library'}>
      <a href="#library"><span className="startIcon"><BookOpen size={20}/></span><span><strong>{vi?'Đọc & tra cứu':'Read & search'}</strong><small>{vi?'Tìm theo tên kinh, mã số, Pāli hoặc chủ đề':'Search by title, code, Pāli or topic'}</small></span><ArrowRight size={17}/></a>
      <a href="#featured"><span className="startIcon"><Headphones size={20}/></span><span><strong>{vi?'Nghe kinh':'Listen'}</strong><small>{vi?'Nghe trên điện thoại và chỉnh tốc độ theo ý':'Play audio and change speed'}</small></span><ArrowRight size={17}/></a>
      <Link href={`/${locale}/tien-do`}><span className="startIcon"><Activity size={20}/></span><span><strong>{vi?'Thư viện đang hoàn thiện':'Library progress'}</strong><small>{vi?'Xem những bộ nào đã sẵn sàng để đọc và nghe':'See what is ready to read and hear'}</small></span><ArrowRight size={17}/></Link>
    </section>

    <section className="shell canonPromo" aria-label={vi?'Lời Phật dạy':'Words from the Canon'}>
      <div className="canonPromoCopy"><p className="kicker">{vi?'LỜI KINH ĐỂ GHI NHỚ':'A CANONICAL REFLECTION'}</p><h2>{vi?'“Không làm các điều ác, siêng làm các điều lành, giữ tâm ý trong sạch.”':'“Avoid what is unwholesome, cultivate what is wholesome, purify the mind.”'}</h2><p>{vi?'Pháp Cú 183 · một lời dạy ngắn gọn về con đường tu tập.':'Dhammapada 183 · a concise summary of the path of practice.'}</p><Link href={`/${locale}?collection=KN#library`}>{vi?'Đọc thêm trong Tiểu Bộ':'Explore the Khuddaka Nikāya'} <ArrowRight size={16}/></Link></div>
      <div className="canonPromoTiles"><div><BookOpen size={21}/><span><strong>{vi?'Kinh Tạng':'Sutta'}</strong><small>{vi?'Lời dạy và đối thoại':'discourses'}</small></span></div><div><Scale size={21}/><span><strong>{vi?'Luật Tạng':'Vinaya'}</strong><small>{vi?'Đời sống và giới luật':'discipline'}</small></span></div><div><TableProperties size={21}/><span><strong>{vi?'Vi Diệu Pháp':'Abhidhamma'}</strong><small>{vi?'Phân tích các pháp':'analysis'}</small></span></div></div>
    </section>

    <section className="section shell" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{vi?'Khám phá 5 bộ kinh Nikāya':'Five Nikāya collections'}</h2><p>{vi?'Mỗi bộ có một cách sắp xếp và nhịp đọc riêng. Chọn bộ kinh bạn muốn học hôm nay.':'Each collection has its own structure and rhythm. Choose where you would like to begin.'}</p></div></div>
      <div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:c.descEn}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div>
    </section>

    <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Tìm lời dạy bạn cần':'Search & browse'}</h2><p>{vi?'Tìm theo tên kinh, mã số, Pāli hoặc chủ đề; sau đó chọn bộ kinh hay những bài đã có audio.':'Search by title, code, Pāli or topic, then choose a collection or audio availability.'}</p></div></div><LibraryExplorer locale={locale} placeholder={vi?'Tìm tên kinh, mã số, Pāli hoặc chủ đề…':d.search} initialCollection={initialCollection}/></div></section>

    <section className="section shell" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{vi?'Gợi ý để đọc hoặc nghe hôm nay':d.featured}</h2><p>{vi?'Một vài bài kinh dễ bắt đầu, gần với đời sống và thuận tiện để đọc hoặc nghe trên điện thoại.':d.featuredLead}</p></div></div><div className="featuredRail">{featured.map(s=>{const audio=suttaAudio(s,locale);return <Link className="featuredCard" href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual"><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi)}</span><span>{audio?(vi?'CÓ AUDIO':'AUDIO'):`${s.readMinutes} ${d.minutes}`}</span></div><h3>{vi?s.vi:s.en}</h3><p>{s.pali}</p><div className="topicRow">{s.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}</div></div></Link>})}</div></section>

    <section className="shell homeTrustBand">
      <div><ShieldCheck size={22}/><span><strong>{vi?'Nguồn rõ ràng':'Traceable sources'}</strong><small>{vi?'Mỗi bài giữ thông tin nguồn để người đọc có thể đối chiếu khi cần.':'Source details remain available for verification.'}</small></span></div>
      <div><Sparkles size={22}/><span><strong>{vi?'Tôn trọng kinh văn':'Respect for scripture'}</strong><small>{vi?'AI chỉ hỗ trợ công cụ; không được tạo ra lời kinh thay cho nguồn gốc.':'AI may assist the interface, not invent scripture.'}</small></span></div>
      <div><Download size={22}/><span><strong>{vi?'Đọc và nghe lâu dài':'Read and listen long-term'}</strong><small>{vi?'Audio và tài liệu được chuẩn bị theo hướng có thể lưu giữ và dùng lại lâu dài.':'Audio and documents are prepared for durable preservation.'}</small></span></div>
    </section>

    <footer><div className="shell footerInner"><div><strong>{vi?'Thư Viện Tam Tạng Pāli':d.brand}</strong><small>{vi?'Đọc · Nghe · Suy ngẫm · Lưu giữ':'Read · Listen · Reflect · Preserve'}</small></div><span>{d.footer}</span></div></footer>
  </main>;
}
