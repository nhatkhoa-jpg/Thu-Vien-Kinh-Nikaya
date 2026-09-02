import Link from 'next/link';
import {Activity,ArrowRight,BookOpen,Headphones,Download,Bookmark,Clock,Play} from 'lucide-react';
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

  return <main className="homePage">
    <section className="hero shell">
      <div className="heroCopy"><div className="eyebrow">{d.heroEyebrow}</div><h1>{d.heroTitle}</h1><p className="lede">{d.heroLead}</p>
        <div className="heroActions"><a className="btn btnPrimary" href="#library"><BookOpen size={18}/>{vi?'Tìm bài kinh':'Find a discourse'}</a><Link className="btn btnGhost" href={`/${locale}/tien-do`}><Activity size={17}/>{vi?'Xem tiến độ số hóa':'Digitization progress'}</Link>{vi&&<Link className="btn btnGhost" href={`/${locale}/thong-ke`}><Activity size={17}/>Thống kê đọc/nghe</Link>}</div>
        <div className="quickStrip"><span><BookOpen size={16}/>{d.quickRead}</span><span><Headphones size={16}/>{d.quickAudio}</span><span><Download size={16}/>{d.quickDownload}</span><span><Bookmark size={16}/>{d.quickProgress}</span></div>
      </div>
      <aside className="heroFocus"><div className="heroFocusTop"><span className="focusBadge dualCode"><strong>{suttaDisplayCode(heroSutta,vi)}</strong>{vi&&<small>{heroSutta.code}</small>}</span><span className="miniMeta"><Clock size={14}/>{heroSutta.readMinutes} {d.minutes}</span></div><div><p className="kicker">{vi?'Bài đọc gợi ý':'Suggested reading'}</p><h2>{vi?heroSutta.vi:heroSutta.en}</h2><p>{vi?'Kham nhẫn, lời nói khó nghe và cách giữ tâm không sân hận.':'Patience, difficult speech, and keeping a mind free from hate.'}</p></div><Link className="focusAction" href={`/${locale}/library/${heroSutta.slug}`}><span className="playCircle"><Play size={18} fill="currentColor"/></span><span><strong>{vi?'Mở bài kinh':'Open discourse'}</strong><small>{heroAudio?(vi?(heroAudio.provider==='Google Cloud Text-to-Speech'?'Có Google TTS giọng HD':'Có MP3 dựng sẵn'):'Prebuilt MP3 available'):(vi?'Đọc toàn văn ngay trên trang':'Read the full text here')}</small></span><ArrowRight size={18}/></Link></aside>
    </section>

    {vi&&<section className="shell" style={{paddingTop:8}}><div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',padding:'14px 16px',border:'1px solid rgba(127,127,127,.22)',borderRadius:16}}><Headphones size={20}/><strong>Nghe thử giọng đọc Google Cloud</strong><span style={{opacity:.7}}>Chirp 3 HD / Neural2 / WaveNet</span><Link href={`/${locale}/thu-giong`} style={{marginLeft:'auto',fontWeight:800}}>So sánh giọng <ArrowRight size={15} style={{verticalAlign:'middle'}}/></Link></div></section>}

    <section className="section shell" id="collections"><div className="sectionHead compactHead"><div><span className="sectionLabel">01</span><h2>{vi?'5 bộ kinh Nikāya':'Five Nikāya collections'}</h2><p>{vi?'Chọn trực tiếp Trường Bộ, Trung Bộ, Tương Ưng Bộ, Tăng Chi Bộ hoặc Tiểu Bộ để lọc thư viện.':'Choose a collection to filter the library.'}</p></div></div>
      <div className="collectionGrid">{collections.map(c=><Link className={`collectionCard ${c.accent}`} href={`/${locale}?collection=${c.code}#library`} key={c.code}><div className="collectionTop"><span className="collectionCode dualCode"><strong>{collectionDisplayCode(c.code,vi)}</strong>{vi&&<small>{c.code}</small>}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{vi?c.descVi:c.descEn}</p></div><span className="collectionArrow"><ArrowRight size={18}/></span></Link>)}</div>
    </section>

    <section className="section librarySection" id="library"><div className="shell"><div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Tìm kinh & tra cứu':'Search & browse'}</h2><p>{vi?'Tìm theo mã Việt/quốc tế, tên kinh, Pāli hoặc chủ đề; lọc theo từng bộ và bài có MP3.':'Search by code, title, Pāli or topic and filter by collection or audio.'}</p></div></div><LibraryExplorer locale={locale} placeholder={d.search} initialCollection={initialCollection}/></div></section>

    <section className="section shell" id="featured"><div className="sectionHead"><div><span className="sectionLabel">03</span><h2>{d.featured}</h2><p>{d.featuredLead}</p></div></div><div className="featuredRail">{featured.map(s=>{const audio=suttaAudio(s,locale);return <Link className="featuredCard" href={`/${locale}/library/${s.slug}`} key={s.slug}><div className="featuredVisual"><span className="dualCode"><strong>{suttaDisplayCode(s,vi)}</strong>{vi&&<small>{s.code}</small>}</span>{audio&&<span className="audioDot" title={audio.provider}><Headphones size={16}/></span>}</div><div className="featuredBody"><div className="featuredMeta"><span>{collections.find(c=>c.code===s.collection)?.[vi?'vi':'en']||collectionDisplayCode(s.collection,vi)}</span><span>{s.readMinutes} {d.minutes}</span></div><h3>{vi?s.vi:s.en}</h3><p>{s.pali}</p>{vi&&audio?.provider==='Google Cloud Text-to-Speech'&&<small style={{fontWeight:800}}>Google TTS · giọng HD</small>}<div className="topicRow">{s.topics.slice(0,2).map(t=><span key={t}>{t}</span>)}</div></div></Link>})}</div></section>

    <footer><div className="shell footerInner"><strong>{d.brand}</strong><span>{d.footer}</span></div></footer>
  </main>;
}
