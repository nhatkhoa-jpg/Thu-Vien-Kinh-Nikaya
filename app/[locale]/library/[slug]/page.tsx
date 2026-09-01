import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,Clock,BookOpen,ArrowRight} from 'lucide-react';
import {dict,isLocale,locales,type Locale} from '@/lib/i18n';
import {suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio,suttaBook} from '@/lib/data';
import {getSuttaFullText} from '@/lib/sutta-content';
import AudioPlayer from '@/components/AudioPlayer';
import ReaderProgress from '@/components/ReaderProgress';
import YouTubeEmbed from '@/components/YouTubeEmbed';

const baseUrl=process.env.NEXT_PUBLIC_SITE_URL||'https://thu-vien-nikaya-now-khoa-3f1b.vercel.app';
export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;
  if(!isLocale(raw))return{};
  const s=suttas.find(x=>x.slug===slug);if(!s)return{};
  const locale=raw as Locale;const vi=locale==='vi';const code=suttaDisplayCode(s,vi);const title=vi?`${code} · ${s.vi}`:`${code} · ${s.en}`;const description=vi?s.summaryVi:s.summaryEn;
  return{title,description,alternates:{canonical:`${baseUrl}/${locale}/library/${slug}`,languages:Object.fromEntries(locales.map(l=>[l,`${baseUrl}/${l}/library/${slug}`]))},openGraph:{title,description,url:`${baseUrl}/${locale}/library/${slug}`,type:'article'}};
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const d=dict(locale);const s=suttas.find(x=>x.slug===slug);if(!s)notFound();
  const vi=locale==='vi';const title=vi?s.vi:s.en;const displayCode=suttaDisplayCode(s,vi);const displayCollection=collectionDisplayCode(s.collection,vi);
  const related=suttas.filter(x=>x.collection===s.collection&&x.slug!==s.slug).slice(0,3);
  const audio=suttaAudio(s,locale);const book=suttaBook(s,locale);
  const fullText=await getSuttaFullText(s.canonicalRef,locale);
  const sourceUrl=fullText?.sourceUrl||s.sourceUrl;

  return <main className="readerPage"><div className="shell readerShell">
    <div className="readerTopline"><Link href={`/${locale}#library`} className="backLink"><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><span>{displayCollection}</span><span>{displayCode}{vi&&<small className="intlRef"> · {s.code}</small>}</span></div>
    <div className="readerLayout">
      <article className="readerMain">
        <div className="readerTitleMeta"><span className="readerCode dualCode"><strong>{displayCode}</strong>{vi&&<small>{s.code}</small>}</span><span><Clock size={14}/>{s.readMinutes} {d.minutes}</span>{audio&&<span><Headphones size={14}/>{vi?'Audio tiếng Việt':'Audio'}</span>}</div>
        <h1>{title}</h1><p className="readerPali">{s.pali}</p>
        <ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>
        <div className="suttaText">
          <section><span className="textSectionLabel">01 · {d.readerIntro}</span><p>{vi?s.summaryVi:s.summaryEn}</p></section>
          <section><span className="textSectionLabel">02 · {d.readerPractice}</span><p>{vi?s.practiceVi:s.practiceEn}</p></section>
          <section className="fullTextSection">
            <div className="fullTextHeader"><div><span className="textSectionLabel">03 · {vi?'TOÀN VĂN BÀI KINH':'FULL TEXT'}</span><h2>{vi?'Đọc ngay tại thư viện':'Read here in the library'}</h2></div>{fullText&&<small>{vi?'Bản dịch':'Translation'}: {fullText.author}</small>}</div>
            {fullText?.segments.length?<div className="fullTextBody">{fullText.segments.map(seg=><p id={seg.id.replace(/[^a-zA-Z0-9_-]/g,'-')} key={seg.id}>{seg.text}</p>)}</div>:<div className="contentUnavailable"><p>{vi?'Bản toàn văn của ngôn ngữ này đang tạm thời không tải được. Thư viện sẽ không tự chuyển sang tiếng Anh để tránh làm người đọc nhầm ngôn ngữ.':'The full text for this language is temporarily unavailable. The library will not silently fall back to another language.'}</p></div>}
          </section>
          <section className="sourceReading compactSource"><BookOpen size={21}/><div><h2>{vi?'Nguồn và đối chiếu':'Source & verification'}</h2><p>{vi?'Nội dung toàn văn được hiển thị ngay tại đây; đường dẫn nguồn chỉ dùng để kiểm chứng bản dịch và đối chiếu khi cần.':'The full text is shown here; the source link is provided for verification and comparison.'}</p><a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Xem nguồn gốc':'View source'} <ExternalLink size={14}/></a></div></section>
        </div>
      </article>
      <aside className="readerSide">
        {audio&&<section className="sideCard primarySide"><div className="sideCardTitle"><span className="sideIcon"><Headphones size={18}/></span><div><small>{vi?'Nghe đúng ngôn ngữ đang chọn':'Matched to selected language'}</small><h3>{audio.label}</h3></div></div><AudioPlayer src={audio.url}/><a className="downloadLink" href={audio.url} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3 tiếng Việt':'Open / download MP3'}</a>{audio.sourceUrl&&<a className="audioSource" href={audio.sourceUrl} target="_blank" rel="noreferrer">{vi?'Nguồn audio':'Audio source'} · {audio.provider}<ExternalLink size={13}/></a>}</section>}
        {!audio&&<section className="sideCard quietCard"><div className="sideCardTitle"><span className="sideIcon"><Headphones size={18}/></span><div><small>Audio</small><h3>{vi?'Chưa có bản tiếng Việt đã kiểm chứng':'No verified audio in this language yet'}</h3></div></div><p>{vi?'Thư viện không phát audio tiếng Anh khi bạn đang ở giao diện tiếng Việt.':'The library does not substitute audio from another language.'}</p></section>}
        {book&&<section className="sideCard"><div className="sideCardTitle"><span className="sideIcon"><Download size={18}/></span><div><small>{vi?'Đọc ngoại tuyến':'Offline reading'}</small><h3>{book.label}</h3></div></div><p>{vi?`Nguồn ${book.provider} · ${book.format}.`:`${book.provider} · ${book.format}.`}</p><a className="btn btnSoft" href={book.url} target="_blank" rel="noreferrer"><Download size={15}/>{vi?'Mở / tải bản tiếng Việt':'Open / download'}</a></section>}
        {s.youtubeId&&<section className="sideCard"><h3>{d.relatedVideo}</h3><YouTubeEmbed videoId={s.youtubeId} title={`${displayCode} ${title}`}/></section>}
        <section className="sideCard sourceCard"><small>{d.sources}</small><p>{fullText?`${fullText.author} · SuttaCentral`:s.licenseShort}</p><a href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Đối chiếu nguồn':'Source'} <ExternalLink size={14}/></a></section>
      </aside>
    </div>
    {related.length>0&&<section className="relatedSection"><div className="sectionHead"><div><h2>{vi?'Đọc tiếp trong cùng tạng':'More in this collection'}</h2></div></div><div className="relatedGrid">{related.map(r=><Link href={`/${locale}/library/${r.slug}`} key={r.slug}><span>{suttaDisplayCode(r,vi)}</span><strong>{vi?r.vi:r.en}</strong><ArrowRight size={17}/></Link>)}</div></section>}
  </div></main>;
}
