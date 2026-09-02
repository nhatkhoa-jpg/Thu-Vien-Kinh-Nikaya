import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,BookOpen,ExternalLink,Scale,TableProperties,ShieldCheck,Library} from 'lucide-react';
import canonRaw from '@/data/catalog/theravada-canon.json';
import viSourcesRaw from '@/data/catalog/theravada-vietnamese-sources.json';
import {isLocale,type Locale} from '@/lib/i18n';
import {SITE_URL} from '@/lib/site';

type CanonBook={id:string;pali:string;vi:string;en:string;noteVi:string;noteEn:string;sourceUrl:string};
type Pitaka={id:string;pali:string;vi:string;en:string;status:string;descriptionVi:string;descriptionEn:string;sourceUrl:string;guideUrl?:string;books?:CanonBook[]};
type ImportantText={id:string;pali:string;vi:string;en:string;status:string;sourceUrl:string};
type CanonData={pitakas:Pitaka[];importantTexts:ImportantText[];rightsPolicy:{vi:string;en:string}};
type ViSource={id:string;scope:string;label:string;provider:string;url:string;language:string;rightsStatus:string;translator?:string;translatorPriority?:string;coverage?:string[]};
type ViSources={policy:string;sources:ViSource[]};
const canon=canonRaw as CanonData;const viSources=viSourcesRaw as ViSources;

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale:raw}=await params;if(!isLocale(raw))return{};const locale=raw as Locale;const vi=locale==='vi';
  const title=vi?'Tam Tạng Pāli Theravāda: Kinh · Luật · Vi Diệu Pháp':'Theravāda Pāli Canon: Sutta · Vinaya · Abhidhamma';
  const description=vi?'Tổng quan Tam Tạng Pāli Theravāda, gồm 5 bộ Nikāya, Luật Tạng và 7 bộ Vi Diệu Pháp, với nguồn đối chiếu rõ ràng.':'A structured guide to the Theravāda Pāli Canon: the Nikāyas, Vinaya Piṭaka, and seven books of the Abhidhamma Piṭaka.';
  return {title,description,alternates:{canonical:`${SITE_URL}/${locale}/tam-tang`},openGraph:{title,description,url:`${SITE_URL}/${locale}/tam-tang`,type:'website'}};
}

function PitakaIcon({id}:{id:string}){if(id==='vinaya')return <Scale size={24}/>;if(id==='abhidhamma')return <TableProperties size={24}/>;return <BookOpen size={24}/>}

export default async function TheravadaCanonPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale;const vi=locale==='vi';
  return <main className="canonPage"><div className="shell canonShell">
    <Link className="infoBack" href={`/${locale}`}><ArrowLeft size={16}/>{vi?'Trang chủ':'Home'}</Link>
    <header className="canonHero">
      <div className="canonHeroIcon"><BookOpen size={28}/></div>
      <div><p className="kicker">{vi?'THƯ VIỆN PHẬT GIÁO THERAVĀDA':'THERAVĀDA LIBRARY'}</p><h1>{vi?'Tam Tạng Pāli: Kinh · Luật · Vi Diệu Pháp':'The Pāli Canon: Sutta · Vinaya · Abhidhamma'}</h1><p>{vi?'Mở rộng thư viện từ 5 bộ Nikāya sang cấu trúc Tam Tạng đầy đủ, nhưng vẫn giữ nguyên nguyên tắc: nguồn rõ ràng, không bịa kinh văn, và chỉ lưu toàn văn khi quyền sử dụng cho phép.':'The library is expanding from the five Nikāyas to the full Tipiṭaka structure while keeping source transparency, text integrity, and rights checks at the center.'}</p></div>
    </header>

    <section className="canonPitakaGrid" aria-label={vi?'Ba tạng':'Three baskets'}>{canon.pitakas.map(p=><article className={`canonPitakaCard canon-${p.id}`} key={p.id}>
      <div className="canonPitakaTop"><span className="canonIcon"><PitakaIcon id={p.id}/></span><span className="canonStatus">{p.status==='active'?(vi?'ĐANG ĐỌC':'LIVE'):(vi?'ĐANG MỞ RỘNG':'EXPANDING')}</span></div>
      <p className="canonPali">{p.pali}</p><h2>{vi?p.vi:p.en}</h2><p>{vi?p.descriptionVi:p.descriptionEn}</p>
      {p.id==='sutta'?<Link className="canonPrimaryAction" href={`/${locale}#library`}>{vi?'Mở 5 bộ Nikāya':'Open the five Nikāyas'}</Link>:<a className="canonPrimaryAction" href={p.sourceUrl} target="_blank" rel="noreferrer">{vi?'Đối chiếu nguồn':'Verify source'} <ExternalLink size={14}/></a>}
    </article>)}</section>

    {canon.pitakas.filter(p=>p.books?.length).map((p,index)=><section className="canonSection" key={p.id} id={p.id}>
      <div className="canonSectionHead"><span className="sectionLabel">0{index+1}</span><div><p className="canonPali">{p.pali}</p><h2>{vi?p.vi:p.en}</h2><p>{vi?p.descriptionVi:p.descriptionEn}</p></div></div>
      <div className="canonBookGrid">{p.books!.map((b,i)=><article className="canonBook" key={b.id}><div className="canonBookIndex">{String(i+1).padStart(2,'0')}</div><div><p className="canonPali">{b.pali}</p><h3>{vi?b.vi:b.en}</h3><p>{vi?b.noteVi:b.noteEn}</p><a href={b.sourceUrl} target="_blank" rel="noreferrer">{vi?'Nguồn / đối chiếu':'Source / verify'} <ExternalLink size={13}/></a></div></article>)}</div>
      {p.guideUrl&&<a className="canonGuideLink" href={p.guideUrl} target="_blank" rel="noreferrer">{vi?'Đọc hướng dẫn học thuật về cấu trúc tạng này':'Read the scholarly guide to this basket'} <ExternalLink size={14}/></a>}
    </section>)}

    <section className="canonSection" id="khuddaka-highlights"><div className="canonSectionHead"><span className="sectionLabel">03</span><div><p className="canonPali">Khuddaka Nikāya</p><h2>{vi?'Một số kinh điển quan trọng trong Tiểu Bộ':'Important works in the Khuddaka Nikāya'}</h2><p>{vi?'Các tác phẩm dưới đây đều được gắn nhãn nguồn riêng để lần lượt materialize vào reader, PDF, search và RAG khi bản dịch phù hợp đã được xác minh.':'These works are source-mapped so they can be materialized into the reader, PDF, search, and RAG layers as licensed translations are verified.'}</p></div></div>
      <div className="canonTextRail">{canon.importantTexts.map(t=><a className="canonTextChip" href={t.sourceUrl} target="_blank" rel="noreferrer" key={t.id}><span>{t.pali}</span><strong>{vi?t.vi:t.en}</strong><ExternalLink size={13}/></a>)}</div>
    </section>

    {vi&&<section className="canonSection" id="nguon-viet"><div className="canonSectionHead"><span className="sectionLabel">04</span><div><p className="canonPali">Vietnamese reference sources</p><h2>Nguồn tiếng Việt đang được đối chiếu</h2><p>Các nguồn này giúp đọc và nghiên cứu ngay trong giai đoạn nhập liệu. Thư viện chỉ liên kết, chưa sao chép toàn văn cho đến khi quyền tái phân phối được xác minh.</p></div></div><div className="canonSourceGrid">{viSources.sources.map(source=><a className="canonSourceCard" href={source.url} target="_blank" rel="noreferrer" key={source.id}><Library size={18}/><span><strong>{source.label}</strong><small>{source.translator||source.translatorPriority||source.provider}</small></span><ExternalLink size={14}/></a>)}</div></section>}

    <section className="canonRights"><ShieldCheck size={22}/><div><strong>{vi?'Nguyên tắc nguồn và bản dịch':'Source and translation policy'}</strong><p>{vi?canon.rightsPolicy.vi:canon.rightsPolicy.en}</p></div></section>
  </div></main>;
}
