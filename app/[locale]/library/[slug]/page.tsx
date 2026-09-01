import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,Clock,BookOpen,ArrowRight} from 'lucide-react';
import {dict,isLocale,locales,type Locale} from '@/lib/i18n';
import {suttas} from '@/lib/data';
import AudioPlayer from '@/components/AudioPlayer';
import ReaderProgress from '@/components/ReaderProgress';
import YouTubeEmbed from '@/components/YouTubeEmbed';

const baseUrl=process.env.NEXT_PUBLIC_SITE_URL||'https://thu-vien-nikaya-now-khoa-3f1b.vercel.app';
const collectionDownloads:Record<string,string>={
  DN:'https://readingfaithfully.org/digha-nikaya-translated-by-bhikkhu-sujato-free-epub-kindle-pdf/',
  MN:'https://readingfaithfully.org/majjhima-nikaya-translated-by-bhikkhu-sujato-free-epub-kindle-pdf/',
  SN:'https://readingfaithfully.org/samyutta-nikaya-translated-bhikkhu-sujato-free-epub-kindle-pdf/',
  AN:'https://readingfaithfully.org/anguttara-nikaya-translated-by-bhikkhu-sujato-free-epub-kindle-pdf/'
};
export function generateStaticParams(){return suttas.flatMap(s=>locales.map(locale=>({locale,slug:s.slug})))}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;
  if(!isLocale(raw))return{};
  const s=suttas.find(x=>x.slug===slug);if(!s)return{};
  const locale=raw as Locale;const title=locale==='vi'?`${s.code} · ${s.vi}`:`${s.code} · ${s.en}`;const description=locale==='vi'?s.summaryVi:s.summaryEn;
  return{title,description,alternates:{canonical:`${baseUrl}/${locale}/library/${slug}`,languages:Object.fromEntries(locales.map(l=>[l,`${baseUrl}/${l}/library/${slug}`]))},openGraph:{title,description,url:`${baseUrl}/${locale}/library/${slug}`,type:'article'}};
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const d=dict(locale);const s=suttas.find(x=>x.slug===slug);if(!s)notFound();
  const vi=locale==='vi';const title=vi?s.vi:s.en;const related=suttas.filter(x=>x.collection===s.collection&&x.slug!==s.slug).slice(0,3);
  const downloadUrl=collectionDownloads[s.collection]||s.bookUrl;
  return <main className="readerPage"><div className="shell readerShell">
    <div className="readerTopline"><Link href={`/${locale}#library`} className="backLink"><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><span>{s.collection}</span><span>{s.code}</span></div>
    <div className="readerLayout">
      <article className="readerMain">
        <div className="readerTitleMeta"><span className="readerCode">{s.code}</span><span><Clock size={14}/>{s.readMinutes} {d.minutes}</span>{s.mp3Url&&<span><Headphones size={14}/>{vi?'Có audio':'Audio'}</span>}</div>
        <h1>{title}</h1><p className="readerPali">{s.pali}</p>
        <ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>
        <div className="suttaText">
          <section><span className="textSectionLabel">01 · {d.readerIntro}</span><p>{vi?s.summaryVi:s.summaryEn}</p></section>
          <section><span className="textSectionLabel">02 · {d.readerPractice}</span><p>{vi?s.practiceVi:s.practiceEn}</p></section>
          <section className="sourceReading"><BookOpen size={23}/><div><h2>{vi?'Đọc bản kinh đầy đủ':'Read the complete text'}</h2><p>{vi?'Mở bản văn tại nguồn để đọc toàn văn và đối chiếu Pāli khi cần.':'Open the source edition for the complete text and Pāli references.'}</p><a className="btn btnPrimary" href={s.sourceUrl} target="_blank" rel="noreferrer">{d.openSource}<ExternalLink size={16}/></a></div></section>
        </div>
      </article>
      <aside className="readerSide">
        {s.mp3Url&&<section className="sideCard primarySide"><div className="sideCardTitle"><span className="sideIcon"><Headphones size={18}/></span><div><small>{d.listenNow}</small><h3>{d.mp3}</h3></div></div><AudioPlayer src={s.mp3Url}/><a className="downloadLink" href={s.mp3Url} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a></section>}
        {downloadUrl&&<section className="sideCard"><div className="sideCardTitle"><span className="sideIcon"><Download size={18}/></span><div><small>{vi?'Đọc ngoại tuyến':'Offline reading'}</small><h3>{d.book}</h3></div></div><p>{vi?'Mở trang tải miễn phí để chọn PDF, EPUB hoặc định dạng phù hợp cho thiết bị.':'Open the free download page to choose PDF, EPUB, or another format for your device.'}</p><a className="btn btnSoft" href={downloadUrl} target="_blank" rel="noreferrer">{d.downloadBook}<ExternalLink size={15}/></a></section>}
        {s.youtubeId&&<section className="sideCard"><h3>{d.relatedVideo}</h3><YouTubeEmbed videoId={s.youtubeId} title={`${s.code} ${title}`}/></section>}
        <section className="sideCard sourceCard"><small>{d.sources}</small><p>{s.licenseShort}</p><a href={s.sourceUrl} target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={14}/></a></section>
      </aside>
    </div>
    {related.length>0&&<section className="relatedSection"><div className="sectionHead"><div><h2>{vi?'Đọc tiếp trong cùng tạng':'More in this collection'}</h2></div></div><div className="relatedGrid">{related.map(r=><Link href={`/${locale}/library/${r.slug}`} key={r.slug}><span>{r.code}</span><strong>{vi?r.vi:r.en}</strong><ArrowRight size={17}/></Link>)}</div></section>}
  </div></main>;
}
