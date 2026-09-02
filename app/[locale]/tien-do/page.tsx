import Link from 'next/link';
import {BookOpen,CheckCircle2,Headphones,Search,ShieldCheck,Sparkles} from 'lucide-react';
import {isLocale,type Locale} from '@/lib/i18n';
import {notFound} from 'next/navigation';
import {collections,suttas,suttaAudio} from '@/lib/data';

export const revalidate=3600;

const publicStatus:Record<string,{noteVi:string;noteEn:string;state:'ready'|'growing'}>={
  DN:{state:'ready',noteVi:'Đã có danh mục, toàn văn tiếng Việt và audio để đọc/nghe trực tuyến.',noteEn:'Catalog, Vietnamese full text and audio are available online.'},
  MN:{state:'ready',noteVi:'Đủ 152 bài trong danh mục, có audio; toàn văn tiếng Việt đang được chuẩn hóa để hiển thị đồng nhất.',noteEn:'All 152 discourses are cataloged with audio; Vietnamese full text is being normalized for consistent display.'},
  SN:{state:'growing',noteVi:'Đã xác định đầy đủ cấu trúc 56 Tương ưng; toàn văn đang được bổ sung liên tục.',noteEn:'The full 56-saṁyutta structure is mapped and full text is being added continuously.'},
  AN:{state:'growing',noteVi:'Đã xác định 1.408 mục kinh theo cấu trúc chuẩn; nội dung tiếng Việt đang được tích hợp.',noteEn:'1,408 canonical entries have been mapped; Vietnamese content is being integrated.'},
  KN:{state:'growing',noteVi:'Đang chuẩn hóa cấu trúc nhiều tập của Tiểu Bộ để tránh gộp hoặc tách sai.',noteEn:'The multi-work Minor Collection structure is being normalized carefully.'},
};

export default async function ProgressPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale;const vi=locale==='vi';
  const audioReady=suttas.filter(s=>Boolean(suttaAudio(s,locale))).length;
  const catalogReady=suttas.length;

  return <main className="progressPage"><div className="shell progressShell">
    <section className="progressHero" style={{alignItems:'stretch'}}>
      <div style={{maxWidth:820}}>
        <span className="eyebrow">{vi?'THƯ VIỆN ĐANG ĐƯỢC HOÀN THIỆN':'LIBRARY IN PROGRESS'}</span>
        <h1>{vi?'Một thư viện Nikāya để đọc, nghe và tra cứu lâu dài':'A Nikāya library built for reading, listening and long-term reference'}</h1>
        <p>{vi?'Mục tiêu là đưa năm bộ kinh Nikāya vào một nơi dễ sử dụng trên điện thoại và máy tính, có nguồn đối chiếu rõ ràng, đọc trực tuyến, nghe audio và tải tài liệu khi cần. Nội dung được bổ sung từng bước; phần chưa chắc chắn sẽ không được tự ý bịa hoặc gắn nhãn là hoàn tất.':'The goal is to bring the five Nikāya collections into one reliable place with clear sources, online reading, audio and downloads. Content is added in verified stages; uncertain material is never presented as complete.'}</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
          <Link className="btn btnPrimary" href={`/${locale}#library`}><Search size={17}/>{vi?'Tìm bài kinh':'Search the library'}</Link>
          <Link className="btn btnGhost" href={`/${locale}/thu-giong`}><Headphones size={17}/>{vi?'Nghe thử giọng đọc':'Try the narration'}</Link>
        </div>
      </div>
      <div style={{minWidth:260,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,alignContent:'center'}}>
        <div style={{padding:18,border:'1px solid var(--line)',borderRadius:18,background:'var(--surface)'}}><strong style={{fontSize:28,display:'block'}}>{catalogReady.toLocaleString('vi-VN')}</strong><span style={{fontSize:12,color:'var(--muted)'}}>{vi?'mục kinh trong thư viện':'catalog entries'}</span></div>
        <div style={{padding:18,border:'1px solid var(--line)',borderRadius:18,background:'var(--surface)'}}><strong style={{fontSize:28,display:'block'}}>{audioReady.toLocaleString('vi-VN')}</strong><span style={{fontSize:12,color:'var(--muted)'}}>{vi?'bài hiện có audio':'entries with audio'}</span></div>
      </div>
    </section>

    <section className="section" style={{paddingTop:20}}>
      <div className="sectionHead"><div><span className="sectionLabel">01</span><h2>{vi?'Tiến độ theo từng bộ kinh':'Progress by collection'}</h2><p>{vi?'Chỉ hiển thị thông tin hữu ích cho người đọc; trạng thái kỹ thuật nội bộ đã được ẩn.':'Only reader-facing information is shown; internal technical status is intentionally hidden.'}</p></div></div>
      <div className="collectionGrid">{collections.map(c=>{const st=publicStatus[c.code];return <article className={`collectionCard ${c.accent}`} key={c.code} style={{minHeight:290}}><div className="collectionTop"><span className="collectionCode">{vi?c.viCode:c.code}</span><span className="collectionCount">{c.count}</span></div><div><h3>{vi?c.vi:c.en}</h3><p className="pali">{c.pali}</p><p>{st?.[vi?'noteVi':'noteEn']}</p></div><div style={{marginTop:'auto',paddingTop:18,display:'flex',alignItems:'center',gap:7,fontSize:11,fontWeight:800,color:st?.state==='ready'?'var(--brand)':'var(--gold)'}}>{st?.state==='ready'?<CheckCircle2 size={16}/>:<Sparkles size={16}/>}<span>{st?.state==='ready'?(vi?'Đã có thể sử dụng':'Available now'):(vi?'Đang tiếp tục bổ sung':'Growing continuously')}</span></div></article>})}</div>
    </section>

    <section className="section" style={{paddingTop:14}}>
      <div className="sectionHead"><div><span className="sectionLabel">02</span><h2>{vi?'Bạn có thể làm gì ngay bây giờ?':'What can you do right now?'}</h2></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
        {[{icon:<BookOpen size={20}/>,t:vi?'Đọc toàn văn':'Read full text',d:vi?'Mở bài kinh trực tiếp trên web, chữ lớn và dễ đọc trên điện thoại.':'Open discourses directly in a mobile-friendly reader.'},{icon:<Headphones size={20}/>,t:vi?'Nghe audio':'Listen to audio',d:vi?'Nghe MP3, đổi tốc độ và tiếp tục từ vị trí đã nghe trước đó.':'Play MP3, change speed and resume where you left off.'},{icon:<Search size={20}/>,t:vi?'Tìm và lọc':'Search and filter',d:vi?'Tìm theo mã kinh, tên Việt, Pāli, bộ kinh hoặc chủ đề.':'Search by reference, title, Pāli, collection or topic.'},{icon:<ShieldCheck size={20}/>,t:vi?'Đối chiếu nguồn':'Verify sources',d:vi?'Các bài có nguồn được ghi rõ để người đọc có thể kiểm tra lại khi cần.':'Source information is shown so readers can verify material when needed.'}].map(x=><article key={x.t} style={{padding:20,border:'1px solid var(--line)',borderRadius:20,background:'var(--surface)'}}><div style={{width:42,height:42,borderRadius:13,display:'grid',placeItems:'center',background:'var(--surface-2)',color:'var(--brand)',marginBottom:14}}>{x.icon}</div><h3 style={{margin:'0 0 7px',fontSize:18}}>{x.t}</h3><p style={{margin:0,color:'var(--muted)',lineHeight:1.6,fontSize:13}}>{x.d}</p></article>)}</div>
    </section>

    <section style={{margin:'18px 0 38px',padding:24,border:'1px solid #d7ded9',borderRadius:22,background:'#f2f7f4'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}><ShieldCheck size={23} style={{flex:'0 0 auto',marginTop:2,color:'var(--brand)'}}/><div><strong style={{fontSize:17}}>{vi?'Nguyên tắc của thư viện':'Library principle'}</strong><p style={{margin:'7px 0 0',lineHeight:1.7,color:'var(--muted)'}}>{vi?'Ưu tiên bản kinh có nguồn rõ ràng và giữ nguyên cấu trúc kinh điển. Phần nào chưa có bản Việt đáng tin cậy sẽ được ghi là chưa có, thay vì dùng AI tạo nội dung rồi trình bày như kinh văn gốc.':'The library prioritizes traceable sources and canonical structure. When a trustworthy translation is unavailable, it is marked as unavailable rather than generated and presented as scripture.'}</p></div></div>
    </section>

    <Link className="backProgress" href={`/${locale}`}>{vi?'← Về trang chủ':'← Back home'}</Link>
  </div></main>;
}
