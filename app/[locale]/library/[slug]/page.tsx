import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,Clock,ArrowRight,FileText,ChevronDown} from 'lucide-react';
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
import PassageCollector from '@/components/PassageCollector';

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;if(!isLocale(raw))return{};
  const s=suttas.find(x=>x.slug===slug);if(!s)return{};const locale=raw as Locale;const vi=locale==='vi';const code=suttaDisplayCode(s,vi);const title=vi?`${code} · ${s.vi}`:`${code} · ${s.en}`;const description=vi?s.summaryVi:s.summaryEn;
  return{title,description,alternates:{canonical:`${SITE_URL}/${locale}/library/${slug}`,languages:Object.fromEntries(locales.map(l=>[l,`${SITE_URL}/${l}/library/${slug}`]))},openGraph:{title,description,url:`${SITE_URL}/${locale}/library/${slug}`,type:'article'}};
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const d=dict(locale);const s=suttas.find(x=>x.slug===slug);if(!s)notFound();
  const vi=locale==='vi';const title=vi?s.vi:s.en;const displayCode=suttaDisplayCode(s,vi);const displayCollection=collectionDisplayCode(s.collection,vi);
  const related=suttas.filter(x=>x.collection===s.collection&&x.slug!==s.slug).slice(0,3);const audio=suttaAudio(s,locale);
  const fullText=await getSuttaFullText(s.canonicalRef,locale);const sourceUrl=fullText?.sourceUrl||s.sourceUrl;
  const paragraphs=fullText?.segments.map(x=>x.text).filter(Boolean)||[];const plainText=paragraphs.join('\n\n');
  const sourceAuthor=(fullText?.author||'').replace(/^Bhikkhu\s+/i,'').trim();const sourceLabel=fullText?`${sourceAuthor||fullText.author} · SuttaCentral`:s.licenseShort;

  return <main className="readerPage"><div className="shell readerShell">
    <div className="readerTopline"><Link href={`/${locale}#library`} className="backLink"><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><span>{displayCollection}</span><span>{displayCode}{vi&&<small className="intlRef"> · {s.code}</small>}</span></div>
    <ReaderQuickJump locale={locale} currentSlug={slug}/>
    <div className="readerLayout">
      <article className="readerMain">
        <div className="readerTitleMeta"><span className="readerCode dualCode"><strong>{displayCode}</strong>{vi&&<small>{s.code}</small>}</span><span><Clock size={14}/>{s.readMinutes} {d.minutes}</span>{audio&&<span><Headphones size={14}/>{vi?'Có MP3':'MP3 available'}</span>}</div>
        <h1>{title}</h1><p className="readerPali">{s.pali}</p><ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>

        <section className="readerEssentials compactEssentials" aria-label={vi?'Nghe và tải':'Listen and download'}>
          {audio&&<details className="essentialDisclosure mp3Disclosure primaryMp3Disclosure" id="mp3"><summary title={vi?'Nghe MP3 dựng sẵn, dùng trên mọi thiết bị':'Play the prebuilt MP3 on any device'}><span className="miniActionIcon"><Headphones size={17}/></span><span><strong>{vi?'Nghe bài kinh':'Listen'}</strong><small>{vi?(audio.provider==='5 Đại Tạng Kinh Nikāya'?'MP3 dựng sẵn · mọi thiết bị':'MP3'):'Prebuilt MP3 · all devices'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><AudioPlayer src={audio.url} segments={audio.segments} manifestUrl={audio.manifestUrl} storageKey={`${locale}:${s.slug}`}/><div className="mp3Links"><a className="downloadLink" href={audio.downloadUrl||audio.url} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>{audio.sourceUrl&&<a className="audioSource" href={audio.sourceUrl} target="_blank" rel="noreferrer">{vi?'Văn bản đối chiếu':'Text source'}<ExternalLink size={13}/></a>}</div></div></details>}
          {plainText&&<BrowserReader text={plainText} locale={locale}/>} 
          {paragraphs.length>0&&<details className="essentialDisclosure pdfDisclosure" id="pdf"><summary title={vi?'Tạo PDF từ chính nội dung bài kinh đang đọc':'Generate a PDF from this text'}><span className="miniActionIcon"><FileText size={17}/></span><span><strong>PDF</strong><small>{vi?'Tự tạo':'Generated'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><PdfDownloadButton code={displayCode} title={title} pali={s.pali} summary={vi?s.summaryVi:s.summaryEn} paragraphs={paragraphs} sourceLabel={sourceLabel} sourceUrl={sourceUrl} locale={locale}/></div></details>}
        </section>

        <div className="suttaText">
          <section><span className="textSectionLabel">01 · {d.readerIntro}</span><p>{vi?s.summaryVi:s.summaryEn}</p></section>
          <section><span className="textSectionLabel">02 · {d.readerPractice}</span><p>{vi?s.practiceVi:s.practiceEn}</p></section>
          <section className="fullTextSection">
            <div className="fullTextHeader"><div><span className="textSectionLabel">03 · {vi?'TOÀN VĂN BÀI KINH':'FULL TEXT'}</span><h2>{vi?'Đọc ngay tại thư viện':'Read here in the library'}</h2></div>{fullText&&<small>{vi?'Bản dịch':'Translation'}: {sourceAuthor||fullText.author}</small>}</div>
            {paragraphs.length&&fullText?<PassageCollector segments={fullText.segments} canonicalRef={s.canonicalRef} displayCode={displayCode} title={title} slug={slug} locale={locale}/>:<div className="contentUnavailable"><p>{vi?'Bản toàn văn của ngôn ngữ này đang tạm thời không tải được. Thư viện sẽ không tự chuyển sang ngôn ngữ khác.':'The full text for this language is temporarily unavailable. The library will not silently fall back to another language.'}</p></div>}
          </section>
          <section className="sourceReading compactSource"><div><span className="textSectionLabel">{vi?'NGUỒN':'SOURCE'}</span><p>{vi?<><strong>Bản dịch:</strong> {sourceAuthor||fullText?.author||'—'} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">Đối chiếu SuttaCentral <ExternalLink size={13}/></a></>:<><strong>Translation:</strong> {sourceAuthor||fullText?.author||'—'} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">Verify source <ExternalLink size={13}/></a></>}</p></div></section>
        </div>
      </article>
      <aside className="readerSide">{s.youtubeId&&<section className="sideCard"><h3>{d.relatedVideo}</h3><YouTubeEmbed videoId={s.youtubeId} title={`${displayCode} ${title}`}/></section>}</aside>
    </div>
    {related.length>0&&<section className="relatedSection"><div className="sectionHead"><div><h2>{vi?'Đọc tiếp trong cùng tạng':'More in this collection'}</h2></div></div><div className="relatedGrid">{related.map(r=><Link href={`/${locale}/library/${r.slug}`} key={r.slug}><span>{suttaDisplayCode(r,vi)}</span><strong>{vi?r.vi:r.en}</strong><ArrowRight size={17}/></Link>)}</div></section>}
  </div></main>;
}
