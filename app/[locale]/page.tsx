import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,Clock,Play,ShieldCheck,Sparkles,Scale,TableProperties} from 'lucide-react';
import {dict,isLocale,type Locale} from '@/lib/i18n';
import {collections,suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
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
  const audioReady=suttas.filter(s=>Boolean(suttaAudio(s,locale))).length;

  return <main className="homePage polishedHome">
    <section className="hero shell polishedHero">
      <div className="heroCopy">
        <div className="eyebrow">{vi?'THƯ VIỆN KINH ĐIỂN · ĐỌC & NGHE MIỄN PHÍ':d.heroEyebrow}</div>
        <h1>{d.heroTitle}</h1>
        <p className="lede">{d.heroLead}</p>
        <div className="heroActions">
          <a className="btn btnPrimary" href="#library"><BookOpen size={18}/>{vi?'Đọc kinh ngay':'Find a discourse'}</a>
          <a className="btn btnGhost" href="#featured"><Headphones size={17}/>{vi?'Nghe kinh nổi bật':'Listen now'}</a>
        </div>
        <div className="heroStats" aria-label={vi?'Tổng quan thư viện':'Library overview'}>
          <div><strong>5</strong><span>{vi?'Đại Tạng Nikāya':'Nikāya collections'}</span></div>
          <div><strong>{suttas.length.toLocaleString(vi?'vi-VN':'en-US')}</strong><span>{vi?'mục kinh trong thư viện':'catalog entries'}</span></div>
          <div><strong>{audioReady.toLocaleString(vi?'vi-VN':'en-US')}</strong><span>{vi?'bài có audio':'entries with audio'}</span></div>
        </div>
        <div className="heroTrust"><ShieldCheck size={16}/><span>{vi?'Nguồn rõ ràng · Không dùng AI tạo kinh văn · Tối ưu cho điện thoại':'Traceable sources · No AI-generated scripture · Mobile friendly'}</span></div>
      </div>
      <aside className="heroFocus">
        <div className="heroFocusTop"><span className="focusBadge dualCode"><strong>{suttaDisplayCode(heroSutta,vi)}</strong>{vi&&<small>{heroSutta.code}</small>}</span><span className="miniMeta"><Clock size={14}/>{heroSutta.readMinutes} {d.minutes}</span></div>
        <div><p className="kicker">{vi?'BẮT ĐẦU TỪ MỘT BÀI KINH':'SUGGESTED READING'}</p><h2>{vi?heroSutta.vi:heroSutta.en}</h2><p>{vi?'Kham nhẫn, lời nói khó nghe và cách giữ tâm không sân hận — một bài dễ bắt đầu cho người mới đọc Nikāya.':'Patience, difficult speech, and keeping a mind free from hate.'}</p></div>
        <Link className="focusAction" href={`/${locale}/library/${heroSutta.slug}`}><span className="playCircle"><Play size={18} fill="currentColor"/></span><span><strong>{vi?'Mở bài kinh':'Open discourse'}</strong><small>{heroAudio?(vi?'Có audio · nghe ngay trên trang':'Audio available'):(vi?'Đọc toàn văn ngay trên trang':'Read the full text here')}</small></span><ArrowRight size={18}/></Link>
      </aside>
    </section>

    <section className="shell homeStartBand" aria-label={vi?'Bắt đầu sử dụng thư viện':'Start using the library'}>
      <a href="#library"><span className="startIcon"><BookOpen size={20}/></span><span><strong>{vi?'Đọc & tra cứu':'Read & search'}</strong><small>{vi?'Tìm theo mã, tên Việt, Pāli hoặc chủ đề':'Search by code, title, Pāli or topic'}</small></span><ArrowRight size={17}/></a>
      <a href="#featured"><span className="startIcon"><Headphones size={20}/></span><span><strong>{vi?'Nghe kinh':'Listen'}</strong><small>{vi?'Phát audio, chỉnh tốc độ, nghe trên điện thoại':'Play audio and change speed'}</small></span><ArrowRight size={17}/></a>
      <Link href={`/${locale}/tien-do`}><span className="startIcon"><Activity size={20}/></span><span><strong>{vi?'Về dự án':'Project progress'}</strong><small>{vi?'Xem thư viện đang hoàn thiện đến đâu':'See what is available now'}</small></span><ArrowRight size={17}/></Link>
    </section>

    <section className="shell canonPromo" aria-label={vi?'Mở rộng Tam Tạng Pāli':'Pāli Canon expansion'}>
      <div className="canonPromoCopy"><p className="kicker">{vi?'ĐANG MỞ RỘNG THƯ VIỆN':'LIBRARY EXPANSION'}</p><h2>{vi?'Từ 5 bộ Nikāya đến Tam Tạng Pāli đầy đủ':'From the five Nikāyas to the wider Pāli Canon'}</h2><p>{vi?'Luật Tạng và 7 bộ Vi Diệu Pháp đã được đưa vào cấu trúc thư viện; toàn văn sẽ lần lượt được nhập khi nguồn và quyền sử dụng được xác minh.':'Vinaya and the seven Abhidhamma books are now part of the library structure, with full text added progressively from verified sources.'}</p><Link href={`/${locale}/tam-tang`}>{vi?'Khám phá Tam Tạng Pāli':'Explore the Pāli Canon'} <ArrowRight size={16}/></Link></div>
      <div className="canonPromoTiles"><div><BookOpen size={21}/><span><strong>{vi?'Kinh Tạng':'Sutta'}</strong><small>5 Nikāya</small></span></div><div><Scale size={21}/><span><strong>{vi?'Luật Tạng':'Vinaya'}</strong><small>{vi?'5 phần chính':'core divisions'}</small></span></div><div><TableProperties size={21}/><span><strong>{vi?'Vi Diệu Pháp':'Abhidhamma'}</strong><small>{vi?'7 bộ luận':'7 books'}</small></span></div></div>
    </section>

    <section className="section shell" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{vi?'Khám phá 5 bộ kinh Nikāya':'Five Nikāya collections'}</h2><p>{vi?'Mỗi bộ có cấu trúc, chủ đề và nhịp đọc khác nhau. Chọn một bộ để đi thẳng vào thư viện.':'Choose a collection to filter the library.'}</p></div></div>
      <div className="collectionGrid">{collections.map(c=><Link data-code={collectionDisplayCode(c.code,vi)} className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:c.descEn}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div>
    </section>

    <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Tìm đúng bài kinh bạn cần':'Search & browse'}</h2><p>{vi?'Gõ mã kinh, tên Việt, Pāli hoặc chủ đề; sau đó lọc nhanh theo từng bộ và bài có audio.':'Search by code, title, Pāli or topic and filter by collection or audio.'}</p></div></div><LibraryExplorer locale={locale} placeholder={d.search} initialCollection={initialCollection}/></div></section>

    <section className="section shell" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{vi?'Kinh nổi bật để đọc hoặc nghe ngay':d.featured}</h2><p>{vi?'Một số bài dễ bắt đầu, có chủ đề thực tế và thuận tiện để nghe thử trên điện thoại.':d.featuredLead}</p></div></div><div className="featuredRail">{featured.map(s=>{const audio=suttaAudio(s,locale);return <Link className="featuredCard" href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual"><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot"><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi)}</span><span>{audio?(vi?'CÓ AUDIO':'AUDIO'):`${s.readMinutes} ${d.minutes}`}</span></div><h3>{vi?s.vi:s.en}</h3><p>{s.pali}</p><div className="topicRow">{s.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}</div></div></Link>})}</div></section>

    <section className="shell homeTrustBand">
      <div><ShieldCheck size={22}/><span><strong>{vi?'Ưu tiên nguồn có thể kiểm tra':'Traceable sources'}</strong><small>{vi?'Nguồn và thông tin đối chiếu được giữ rõ ràng khi cần kiểm chứng.':'Source details remain available for verification.'}</small></span></div>
      <div><Sparkles size={22}/><span><strong>{vi?'Kinh văn không do AI bịa':'No AI-generated scripture'}</strong><small>{vi?'AI chỉ hỗ trợ giao diện và công cụ; không được tạo kinh văn thay nguồn gốc.':'AI may assist the interface, not invent scripture.'}</small></span></div>
      <div><Download size={22}/><span><strong>{vi?'Đọc online, hướng tới tải offline':'Online and offline'}</strong><small>{vi?'PDF và audio trọn bộ đang được chuẩn bị để lưu giữ và nghe lâu dài.':'Whole-collection PDF and audio packages are being prepared.'}</small></span></div>
    </section>

    <footer><div className="shell footerInner"><div><strong>{d.brand}</strong><small>{vi?'Đọc · Nghe · Tra cứu · Lưu giữ lâu dài':'Read · Listen · Search · Preserve'}</small></div><span>{d.footer}</span></div></footer>
  </main>;
}
