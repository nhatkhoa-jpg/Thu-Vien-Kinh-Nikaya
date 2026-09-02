import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,Clock,ArrowRight,FileText,ChevronDown,Languages} from 'lucide-react';
import {dict,isDeferredLocale,isLocale,scriptureLocales,type Locale} from '@/lib/i18n';
import {suttas,collectionDisplayCode,suttaDisplayCode,suttaAudio} from '@/lib/data';
import {getSuttaFullText} from '@/lib/sutta-content';
import {SITE_URL} from '@/lib/site';
import AudioPlayer from '@/components/AudioPlayer';
import R2AudioDisclosure from '@/components/R2AudioDisclosure';
import ReaderProgress from '@/components/ReaderProgress';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import BrowserReader from '@/components/BrowserReader';
import PdfDownloadButton from '@/components/PdfDownloadButton';
import ReaderQuickJump from '@/components/ReaderQuickJump';
import PassageCollector from '@/components/PassageCollector';

export const revalidate=86400;

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;if(!isLocale(raw))return{};
  const s=suttas.find(x=>x.slug===slug);if(!s)return{};const locale=raw as Locale;const vi=locale==='vi';const code=suttaDisplayCode(s,vi);const displayTitle=vi?s.vi:s.en;const title=`${code} · ${displayTitle}`;const summary=vi?s.summaryVi:s.summaryEn;const description=summary||`${code} · ${displayTitle} · ${collectionDisplayCode(s.collection,vi)}`;
  const deferred=isDeferredLocale(locale);const canonicalLocale=deferred?'en':locale;
  return{title,description,robots:deferred?{index:false,follow:true}:undefined,alternates:{canonical:`${SITE_URL}/${canonicalLocale}/library/${slug}`,languages:Object.fromEntries(scriptureLocales.map(l=>[l,`${SITE_URL}/${l}/library/${slug}`]))},openGraph:{title,description,url:`${SITE_URL}/${canonicalLocale}/library/${slug}`,type:'article'}};
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const d=dict(locale);const s=suttas.find(x=>x.slug===slug);if(!s)notFound();
  const vi=locale==='vi';const title=vi?s.vi:s.en;const displayCode=suttaDisplayCode(s,vi);const displayCollection=collectionDisplayCode(s.collection,vi);
  const related=suttas.filter(x=>x.collection===s.collection&&x.slug!==s.slug).slice(0,3);const audio=suttaAudio(s,locale);
  const canonicalKey=s.canonicalRef.toLowerCase();const collectionKey=s.collection.toLowerCase();
  const r2AudioSources=vi?[{src:`/media/audio/gemini/${collectionKey}/${canonicalKey}.mp3`,label:'Gemini · giọng đọc chất lượng cao',provider:'gemini' as const},{src:`/media/audio/${collectionKey}/${canonicalKey}.mp3`,label:'MP3 thư viện · dự phòng',provider:'local' as const},...(audio?[{src:audio.url,label:'MP3 thư viện · dự phòng',provider:'local' as const}]:[])]:[];
  const localizedText=await getSuttaFullText(s.canonicalRef,locale);
  const englishFallback=!localizedText&&locale!=='vi'&&locale!=='en'?await getSuttaFullText(s.canonicalRef,'en'):null;
  const fullText=localizedText||englishFallback;const fallbackToEnglish=Boolean(!localizedText&&englishFallback);
  const sourceUrl=fullText?.sourceUrl||s.sourceUrl;
  const paragraphs=fullText?.segments.map(x=>x.text).filter(Boolean)||[];const plainText=paragraphs.join('\n\n');
  const sourceAuthor=(fullText?.author||'').replace(/^Bhikkhu\s+/i,'').trim();const sourceLabel=fullText?`${sourceAuthor||fullText.author} · SuttaCentral`:s.licenseShort;
  const summary=(vi?s.summaryVi:s.summaryEn).trim();const practice=(vi?s.practiceVi:s.practiceEn).trim();const hasSummary=Boolean(summary);const hasPractice=Boolean(practice);
  const measuredMinutes=plainText?Math.max(1,Math.ceil(plainText.split(/\s+/).filter(Boolean).length/200)):null;const readMinutes=s.readMinutes>0?s.readMinutes:measuredMinutes;const estimated=s.readMinutes<=0&&readMinutes!==null;
  const practiceNumber=hasSummary?'02':'01';const fullTextNumber=hasSummary&&hasPractice?'03':hasSummary||hasPractice?'02':'01';

  return <main className="readerPage"><div className="shell readerShell">
    <div className="readerTopline"><Link href={`/${locale}#library`} className="backLink"><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><span>{displayCollection}</span><span>{displayCode}{vi&&<small className="intlRef"> · {s.code}</small>}</span></div>
    <ReaderQuickJump locale={locale} currentSlug={slug}/>
    <div className="readerLayout">
      <article className="readerMain">
        <div className="readerTitleMeta"><span className="readerCode dualCode"><strong>{displayCode}</strong>{vi&&<small>{s.code}</small>}</span>{readMinutes&&<span><Clock size={14}/>{estimated?'~':''}{readMinutes} {d.minutes}</span>}{audio&&<span><Headphones size={14}/>{vi?'Có MP3':'MP3 available'}</span>}</div>
        <h1>{title}</h1><p className="readerPali">{s.pali}</p><ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>

        {fallbackToEnglish&&<div className="contentFallbackNotice" role="note"><Languages size={18}/><div><strong>English text shown temporarily</strong><p>A source-backed translation for the selected language is not available yet. The English translation is displayed clearly as a temporary fallback; the source and translator remain identified below.</p></div></div>}

        <section className="readerEssentials compactEssentials" aria-label={vi?'Nghe và tải':'Listen and download'}>
          {vi&&r2AudioSources.length>0?<R2AudioDisclosure sources={r2AudioSources} storageKey={`${locale}:${s.slug}`} sourceUrl={sourceUrl} vi={vi}/>:audio&&<details className="essentialDisclosure mp3Disclosure primaryMp3Disclosure" id="mp3"><summary title="Play the prebuilt MP3 on any device"><span className="miniActionIcon"><Headphones size={17}/></span><span><strong>Listen</strong><small>Prebuilt MP3 · all devices</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><AudioPlayer src={audio.url} segments={audio.segments} manifestUrl={audio.manifestUrl} storageKey={`${locale}:${s.slug}`}/><div className="mp3Links"><a className="downloadLink" href={audio.downloadUrl||audio.url} target="_blank" rel="noreferrer"><Download size={16}/>Open / download MP3</a>{audio.sourceUrl&&<a className="audioSource" href={audio.sourceUrl} target="_blank" rel="noreferrer">Text source<ExternalLink size={13}/></a>}</div></div></details>}
          {plainText&&<BrowserReader text={plainText} locale={fallbackToEnglish?'en':locale}/>} 
          {paragraphs.length>0&&<details className="essentialDisclosure pdfDisclosure" id="pdf"><summary title={vi?'Tạo PDF từ chính nội dung bài kinh đang đọc':'Generate a PDF from this text'}><span className="miniActionIcon"><FileText size={17}/></span><span><strong>PDF</strong><small>{vi?'Tự tạo':'Generated'}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary><div className="disclosureBody"><PdfDownloadButton code={displayCode} title={title} pali={s.pali} summary={summary} paragraphs={paragraphs} sourceLabel={sourceLabel} sourceUrl={sourceUrl} locale={fallbackToEnglish?'en':locale}/></div></details>}
        </section>

        <div className="suttaText">
          {hasSummary&&<section><span className="textSectionLabel">01 · {d.readerIntro}</span><p>{summary}</p></section>}
          {hasPractice&&<section><span className="textSectionLabel">{practiceNumber} · {d.readerPractice}</span><p>{practice}</p></section>}
          <section className="fullTextSection">
            <div className="fullTextHeader"><div><span className="textSectionLabel">{fullTextNumber} · {vi?'TOÀN VĂN BÀI KINH':'FULL TEXT'}</span><h2>{vi?'Đọc ngay tại thư viện':'Read here in the library'}</h2></div>{fullText&&<small>{fallbackToEnglish?'English · ':vi?'Bản dịch · ':'Translation · '}{sourceAuthor||fullText.author}</small>}</div>
            {paragraphs.length&&fullText?<PassageCollector segments={fullText.segments} canonicalRef={s.canonicalRef} displayCode={displayCode} title={title} slug={slug} locale={fallbackToEnglish?'en':locale}/>:<div className="contentUnavailable"><p>{vi?'Bản toàn văn của ngôn ngữ này hiện chưa có hoặc tạm thời không tải được.':'The requested translation is unavailable or temporarily could not be loaded.'}</p></div>}
          </section>
          <section className="sourceReading compactSource"><div><span className="textSectionLabel">{vi?'NGUỒN':'SOURCE'}</span><p>{fullText?(vi?<><strong>Bản dịch:</strong> {sourceAuthor||fullText.author} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">Đối chiếu SuttaCentral <ExternalLink size={13}/></a></>:<><strong>{fallbackToEnglish?'English translation':'Translation'}:</strong> {sourceAuthor||fullText.author} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">Verify source <ExternalLink size={13}/></a></>):(vi?<><strong>Nguồn:</strong> {s.licenseShort} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={13}/></a></>:<><strong>Source:</strong> {s.licenseShort} <span aria-hidden="true">·</span> <a className="sourceInlineLink" href={sourceUrl} target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={13}/></a></>)}</p></div></section>
        </div>
      </article>
      <aside className="readerSide">{s.youtubeId&&<section className="sideCard"><h3>{d.relatedVideo}</h3><YouTubeEmbed videoId={s.youtubeId} title={`${displayCode} ${title}`}/></section>}</aside>
    </div>
    {related.length>0&&<section className="relatedSection"><div className="sectionHead"><div><h2>{vi?'Đọc tiếp trong cùng tạng':'More in this collection'}</h2></div></div><div className="relatedGrid">{related.map(r=><Link href={`/${locale}/library/${r.slug}`} key={r.slug}><span>{suttaDisplayCode(r,vi)}</span><strong>{vi?r.vi:r.en}</strong><ArrowRight size={17}/></Link>)}</div></section>}
  </div></main>;
}
