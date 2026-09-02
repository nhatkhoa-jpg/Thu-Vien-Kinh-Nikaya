import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Activity,BookOpen,Headphones,Timer,CheckCircle2,ArrowLeft} from 'lucide-react';
import {ANALYTICS_ENDPOINT} from '@/lib/analytics';
import {isLocale,type Locale} from '@/lib/i18n';
import {suttas} from '@/lib/data';

type Counts={view:number;play:number;listen30:number;complete:number};
type Summary={lastUpdated:string|null;totals:Counts;top:Array<{ref:string}&Counts>};

async function loadSummary():Promise<Summary|null>{
  try{
    const r=await fetch(`${ANALYTICS_ENDPOINT}/summary`,{cache:'no-store'});
    if(!r.ok)return null;
    return await r.json() as Summary;
  }catch{return null;}
}

export default async function StatsPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(!isLocale(raw))notFound();
  const locale=raw as Locale;const vi=locale==='vi';const data=await loadSummary();
  const totals=data?.totals||{view:0,play:0,listen30:0,complete:0};
  const nf=new Intl.NumberFormat(vi?'vi-VN':'en-US');
  const cards=[
    {label:vi?'Lượt mở bài':'Article views',value:totals.view,icon:<BookOpen size={20}/>},
    {label:vi?'Bấm nghe':'Audio starts',value:totals.play,icon:<Headphones size={20}/>},
    {label:vi?'Nghe ≥ 30 giây':'Listened ≥ 30s',value:totals.listen30,icon:<Timer size={20}/>},
    {label:vi?'Nghe hết':'Completed audio',value:totals.complete,icon:<CheckCircle2 size={20}/>},
  ];
  const startRate=totals.view?Math.round(totals.play/totals.view*1000)/10:0;
  const depthRate=totals.play?Math.round(totals.listen30/totals.play*1000)/10:0;
  return <main className="shell" style={{maxWidth:1000,padding:'28px 18px 64px'}}>
    <Link href={`/${locale}`} className="backLink"><ArrowLeft size={17}/>{vi?'Trang chủ':'Home'}</Link>
    <div style={{margin:'22px 0'}}><p className="eyebrow"><Activity size={15}/> {vi?'THỐNG KÊ THỰC TẾ':'LIVE USAGE'}</p><h1 style={{fontSize:'clamp(30px,6vw,48px)',margin:'8px 0'}}>{vi?'Lượt đọc & nghe kinh':'Reading & listening analytics'}</h1><p style={{opacity:.72,lineHeight:1.65,maxWidth:760}}>{vi?'Đếm trực tiếp từ website: người mở bài, bắt đầu nghe, nghe ít nhất 30 giây và nghe hết. Không dùng cookie quảng cáo.':'First-party counts for article opens, audio starts, 30-second listening and completions.'}</p></div>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:14,margin:'24px 0'}}>{cards.map(c=><article key={c.label} style={{border:'1px solid rgba(127,127,127,.25)',borderRadius:16,padding:18}}><div style={{display:'flex',gap:8,alignItems:'center',opacity:.68}}>{c.icon}<span>{c.label}</span></div><strong style={{display:'block',fontSize:32,marginTop:10}}>{nf.format(c.value)}</strong></article>)}</section>
    <section style={{display:'flex',gap:12,flexWrap:'wrap',margin:'0 0 28px'}}><span className="btn btnGhost">{vi?'Tỷ lệ bấm nghe':'Listen start rate'}: <strong>{startRate}%</strong></span><span className="btn btnGhost">{vi?'Giữ nghe ≥30s':'30s retention'}: <strong>{depthRate}%</strong></span></section>
    <section><h2>{vi?'Bài được xem/nghe nhiều nhất':'Top discourses'}</h2>{!data?<p style={{opacity:.7}}>{vi?'Dịch vụ thống kê chưa được deploy hoặc đang tạm thời không phản hồi.':'Analytics service is not deployed or temporarily unavailable.'}</p>:data.top.length===0?<p style={{opacity:.7}}>{vi?'Chưa có dữ liệu. Khi độc giả bắt đầu vào đọc/nghe, số liệu sẽ xuất hiện ở đây.':'No usage yet.'}</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th style={{textAlign:'left',padding:10}}>Kinh</th><th>View</th><th>Play</th><th>30s</th><th>Hết</th></tr></thead><tbody>{data.top.slice(0,30).map(row=>{const s=suttas.find(x=>x.canonicalRef.toLowerCase()===row.ref.toLowerCase());return <tr key={row.ref} style={{borderTop:'1px solid rgba(127,127,127,.2)'}}><td style={{padding:10}}><Link href={s?`/${locale}/library/${s.slug}`:'#'}><strong>{row.ref.toUpperCase()}</strong>{s?` · ${vi?s.vi:s.en}`:''}</Link></td><td style={{textAlign:'center'}}>{nf.format(row.view)}</td><td style={{textAlign:'center'}}>{nf.format(row.play)}</td><td style={{textAlign:'center'}}>{nf.format(row.listen30)}</td><td style={{textAlign:'center'}}>{nf.format(row.complete)}</td></tr>})}</tbody></table></div>}</section>
    <p style={{fontSize:12,opacity:.55,marginTop:24}}>{vi?'Cập nhật gần nhất':'Last update'}: {data?.lastUpdated?new Date(data.lastUpdated).toLocaleString(vi?'vi-VN':'en-US'):'—'}</p>
  </main>;
}
