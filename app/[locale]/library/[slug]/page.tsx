import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Download,ExternalLink,Headphones,FileText} from 'lucide-react';
import {dict,isLocale,locales,type Locale} from '@/lib/i18n';
import {suttas} from '@/lib/data';
import AudioPlayer from '@/components/AudioPlayer';
import ReaderProgress from '@/components/ReaderProgress';
import YouTubeEmbed from '@/components/YouTubeEmbed';

const baseUrl=process.env.NEXT_PUBLIC_SITE_URL || 'https://thu-vien-kinh-nikaya-khoa-3f1b.vercel.app';

export function generateStaticParams(){return suttas.flatMap(s=>locales.map(locale=>({locale,slug:s.slug})))}

export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata>{
  const {locale:raw,slug}=await params;
  if(!isLocale(raw)) return {};
  const s=suttas.find(x=>x.slug===slug);
  if(!s) return {};
  const locale=raw as Locale;
  const title=locale==='vi'?`${s.code} · ${s.vi}`:`${s.code} · ${s.en}`;
  const description=locale==='vi'?s.summaryVi:s.summaryEn;
  return {
    title,
    description,
    alternates:{
      canonical:`${baseUrl}/${locale}/library/${slug}`,
      languages:Object.fromEntries(locales.map(l=>[l,`${baseUrl}/${l}/library/${slug}`]))
    },
    openGraph:{title,description,url:`${baseUrl}/${locale}/library/${slug}`,type:'article'}
  };
}

export default async function SuttaPage({params}:{params:Promise<{locale:string;slug:string}>}){
  const {locale:raw,slug}=await params;
  if(!isLocale(raw))notFound();
  const locale=raw as Locale;
  const d=dict(locale);
  const s=suttas.find(x=>x.slug===slug);
  if(!s)notFound();
  const vi=locale==='vi';
  const title=vi?s.vi:s.en;
  return <main><div className="shell reader">
    <article className="readerMain">
      <Link href={`/${locale}#library`} className="btn"><ArrowLeft size={16}/>{vi?'Trở lại thư viện':'Back to library'}</Link>
      <div className="eyebrow" style={{marginTop:30}}>{s.code} · {s.collection}</div>
      <h1>{title}</h1>
      <p className="lede"><em>{s.pali}</em></p>
      <ReaderProgress id={`${locale}:${s.slug}`} locale={locale}/>
      <div className="suttaText">
        <p>{vi?s.summaryVi:s.summaryEn}</p>
        <p>{d.textNotice}</p>
        <p><strong>{vi?'Chủ đề':'Topics'}:</strong> {s.topics.join(' · ')}</p>
      </div>
    </article>
    <aside className="readerSide">
      <div className="downloadCard"><h3>{d.pdf}</h3><p style={{color:'var(--muted)',fontSize:13}}>{s.pdfUrl?(vi?'Mở hoặc tải bản PDF về thiết bị.':'Open or download the PDF to your device.'):d.unavailable}</p>{s.pdfUrl?<a className="btn btnPrimary" href={s.pdfUrl} target="_blank" rel="noreferrer"><Download size={16}/>{d.pdf}</a>:<span className="btn disabled"><FileText size={16}/>{d.pdf}</span>}</div>
      <div className="downloadCard"><h3>{d.mp3}</h3><p style={{color:'var(--muted)',fontSize:13}}>{s.mp3Url?(vi?'Nghe ngay, chỉnh tốc độ hoặc mở tệp MP3 để tải.':'Listen, change speed, or open the MP3 file to download.'):d.unavailable}</p>{s.mp3Url?<><AudioPlayer src={s.mp3Url}/><a className="btn btnPrimary" href={s.mp3Url} target="_blank" rel="noreferrer"><Download size={16}/>{d.mp3}</a></>:<span className="btn disabled"><Headphones size={16}/>{d.mp3}</span>}</div>
      <div className="downloadCard"><h3>{d.relatedVideo}</h3>{s.youtubeId?<YouTubeEmbed videoId={s.youtubeId} title={`${s.code} ${title}`}/>:<p style={{color:'var(--muted)',fontSize:13}}>{vi?'Chưa gắn video. Chỉ cần thêm YouTube ID vào dữ liệu bài kinh là video sẽ hiện ở đây.':'No video attached yet. Add a YouTube ID to this discourse record and the embed appears here.'}</p>}</div>
      <div className="downloadCard"><h3>{d.sources}</h3><p style={{color:'var(--muted)',fontSize:13}}>{s.licenseNote}</p><a className="btn" href={s.sourceUrl} target="_blank" rel="noreferrer">{d.source}<ExternalLink size={15}/></a></div>
    </aside>
  </div></main>;
}
