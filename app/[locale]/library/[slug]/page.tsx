import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,Clock,BookOpen,ArrowRight,FileText,Volume2,ChevronDown} from 'lucide-react';
import {dict,isLocale,locales,type Locale} from '@/lib/i18n';
import {suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getSuttaFullText} from '@/lib/sutta-content';
import {SITE_URL} from '@/lib/site';
import AudioPlayer from '@/components/AudioPlayer';
import ReaderProgress from '@/components/ReaderProgress';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import BrowserReader from '@/components/BrowserReader';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import ReaderQuickJump from '@/components/ReaderQuickJump';

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;
  if(!isLocale(raw))return{};
  const s=suttas.find(x=>x.slug===slug);if(!s)return{};
  const locale=raw as Locale;const vi=locale==='vi';const code=suttaDisplayCode(s,vi);const title=vi?`${code} · ${s.vi}`:`${code} · ${s.en}`;const description=vi?s.summaryVi:s.summaryEn;
  return{title,description,alternates:{canonical:`${SITE_URL}/${locale}/library/${slug}`,languages:Object.fromEntries(locales.map(l=>[l,`${SITE_URL}/${l}/library/${slug}`]))},openGraph:{title,description,url:`${SITE_URL}/${locale}/library/${slug}`,type:'article'}};
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const d=dict(locale);const s=suttas.find(x=>x.slug===slug);if(!s)notFound();
  const vi=locale==='vi';const title=vi?s.vi:s.en;const displayCode=suttaDisplayCode(s,vi);const displayCollection=collectionDisplayCode(s.collection,vi);
  const related=suttas.filter(x=>x.collection===s.collection&&x.slug!==s.slug).slice(0,3);
  const audio=suttaAudio(s,locale);
  const fullText=await getSuttaFullText(s.canonicalRef,locale);
  const sourceUrl=fullText?.sourceUrl||s.sourceUrl;
  const paragraphs=fullText?.segments.map(x=>x.text).filter(Boolean)||[];
  const plainText=paragraphs.join('\n\n');
  const sourceLabel=fullText?`${fullText.author} · SuttaCentral`:s.licenseShort;

  return <main className="readerPage"><div className="shell readerShell">
    <div className="readerTopline"><Link href={`/${locale}#library`} className="backLink"><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><span>{displayCollection}</span><span>{displayCode}{vi&&<small className="intlRef"> · {s.code}</small>}</span></div>
    <ReaderQuickJump locale={locale} currentSlug={slug}/>
    <div className="readerLayout">
      <article className="readerMain">
        <div className="readerTitleMeta"><span className="readerCode dualCode"><strong>{displayCode}</strong>{vi&&<small>{s.code}</small>}</span><span><Clock size={14}/>{s.readMinutes} {d.minutes}</span>{plainText&&<span><Volume2 size={14}/>{vi?'Có đọc tự động':'Speech available'}</span>}</div>
        <h1>{title}</h1><p className="readerPali">{s.pali}</p>
        <ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>

        <section className="readerEssentials compactEssentials" aria-label={vi?'Nghe và tải':'Listen and download'}>
          {plainText&&<details className="essentialDisclosure listenDisclosure" id="listen"><summary title={vi?'Nghe toàn văn bằng giọng thiết bị hoặc giọng nội bộ của thư viện':'Listen with device or internal voice'}><span className="miniActionIcon"><Volume2 size={17}/></span><span><strong>{vi?'Nghe':'Listen'}</strong><small>{vi?'Thiết bị + nội bộ':'Device + internal'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><BrowserReader text={plainText} locale={locale}/></div></details>}
          {paragraphs.length>0&&<details className="essentialDisclosure pdfDisclosure" id="pdf"><summary title={vi?'Tạo PDF từ chính nội dung bài kinh đang đọc':'Generate a PDF from this text'}><span className="miniActionIcon"><FileText size={17}/></span><span><strong>PDF</strong><small>{vi?'Tự tạo':'Generated'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><PdfDownloadButton code={displayCode} title={title} pali={s.pali} summary={vi?s.summaryVi:s.summaryEn} paragraphs={paragraphs} sourceLabel={sourceLabel} sourceUrl={sourceUrl} locale={locale}/></div></details>}
          {audio&&<details className="essentialDisclosure mp3Disclosure" id="mp3"><summary title={vi?'MP3 tiếng Việt từ nguồn bổ sung':'Optional matched-language MP3'}><span className="miniActionIcon"><Headphones size={17}/></span><span><strong>MP3</strong><small>{vi?'Nguồn phụ':'Backup'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><AudioPlayer src={audio.url}/><div className="mp3Links"><a className="downloadLink" href={audio.url} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>{audio.sourceUrl&&<a className="audioSource" href={audio.sourceUrl} target="_blank" rel="noreferrer">{vi?'Nguồn MP3':'MP3 source'} · {audio.provider}<ExternalLink size={13}/></a>}</div></div></details>}
        </section>

        <div className="suttaText">
          <section><span className="textSectionLabel">01 · {d.readerIntro}</span><p>{vi?s.summaryVi:s.summaryEn}</p></section>
          <section><span className="textSectionLabel">02 · {d.readerPractice}</span><p>{vi?s.practiceVi:s.practiceEn}</p></section>
          <section className="fullTextSection">
            <div className="fullTextHeader"><div><span className="textSectionLabel">03 · {vi?'TOÀN VĂN BÀI KINH':'FULL TEXT'}</span><h2>{vi?'Đọc ngay tại thư viện':'Read here in the library'}</h2></div>{fullText&&<small>{vi?'Bản dịch':'Translation'}: {fullText.author}</small>}</div>
            {paragraphs.length?<div className="fullTextBody">{fullText!.segments.map(seg=><p id={seg.id.replace(/[^a-zA-Z0-9_-]/g,'-')} key={seg.id}>{seg.text}</p>)}</div>:<div className="contentUnavailable"><p>{vi?'Bản toàn văn của ngôn ngữ này đang tạm thời không tải được. Thư viện sẽ không tự chuyển sang ngôn ngữ khác.':'The full text for this language is temporarily unavailable. The library will not silently fall back to another language.'}</p></div>}
          </section>
          <section className="sourceReading compactSource"><BookOpen size={21}/><div><h2>{vi?'Nguồn và đối chiếu':'Source & verification'}</h2><p>{vi?'Nội dung chính được đọc ngay trong thư viện. Đường dẫn nguồn chỉ dùng để kiểm chứng bản dịch và đối chiếu khi cần.':'The main text is read here. The source link is for verification and comparison.'}</p><a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Xem nguồn gốc':'View source'} <ExternalLink size={14}/></a></div></section>
        </div>
      </article>
      <aside className="readerSide">
        {s.youtubeId&&<section className="sideCard"><h3>{d.relatedVideo}</h3><YouTubeEmbed videoId={s.youtubeId} title={`${displayCode} ${title}`}/></section>}
        <section className="sideCard sourceCard"><small>{d.sources}</small><p>{sourceLabel}</p><a href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Đối chiếu nguồn':'Source'} <ExternalLink size={14}/></a></section>
      </aside>
    </div>
    {related.length>0&&<section className="relatedSection"><div className="sectionHead"><div><h2>{vi?'Đọc tiếp trong cùng tạng':'More in this collection'}</h2></div></div><div className="relatedGrid">{related.map(r=><Link href={`/${locale}/library/${r.slug}`} key={r.slug}><span>{suttaDisplayCode(r,vi)}</span><strong>{vi?r.vi:r.en}</strong><ArrowRight size={17}/></Link>)}</div></section>}
  </div></main>;
}
