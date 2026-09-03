'use client';
import {useEffect,useState} from 'react';
import {fetchStats} from '@/lib/client-stats';

type Row={name:string;count:number};
type Day={date:string;views:number;visitors:number;plays:number;listeners:number;listen30:number;complete:number};
type Stats={ok:boolean;days:number;generatedAt:string;totals:{views:number;visitors:number;audioPlays:number;listeners:number;listen30:number;audioComplete:number};topPages:Row[];topAudio:Row[];daily:Day[]};

function n(v:number|undefined){return new Intl.NumberFormat('vi-VN').format(v||0)}

export default function StatsDashboard(){
 const [days,setDays]=useState(30);
 const [data,setData]=useState<Stats|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
   let cancelled=false;setLoading(true);setError('');
   fetchStats(days).then(x=>{if(!cancelled)setData(x)}).catch(e=>{if(!cancelled)setError(e?.message||'Không đọc được stats')}).finally(()=>{if(!cancelled)setLoading(false)});
   return()=>{cancelled=true};
 },[days]);
 const t=data?.totals;
 return <main className="statsPage">
   <div className="statsHead"><div><p className="eyebrow">OWNER STATS</p><h1>Thống kê người đọc & người nghe</h1><p>Không lưu IP, email hay tên. Một thiết bị được nhận diện bằng mã ẩn danh cục bộ.</p></div><div className="statsRange">{[1,7,30,90].map(v=><button key={v} className={days===v?'active':''} onClick={()=>setDays(v)}>{v===1?'24h':`${v} ngày`}</button>)}</div></div>
   {loading&&<div className="statsNotice">Đang tải số liệu…</div>}
   {error&&<div className="statsNotice error">{error}</div>}
   {data&&<>
    <section className="statsCards">
      <article><span>Lượt xem trang</span><strong>{n(t?.views)}</strong><small>{n(t?.visitors)} người xem</small></article>
      <article><span>Lượt bấm nghe</span><strong>{n(t?.audioPlays)}</strong><small>{n(t?.listeners)} người nghe</small></article>
      <article><span>Nghe ≥ 30 giây</span><strong>{n(t?.listen30)}</strong><small>{t?.audioPlays?Math.round((t.listen30/t.audioPlays)*100):0}% lượt nghe</small></article>
      <article><span>Nghe hết</span><strong>{n(t?.audioComplete)}</strong><small>{t?.audioPlays?Math.round((t.audioComplete/t.audioPlays)*100):0}% lượt nghe</small></article>
    </section>
    <section className="statsGrid">
      <article className="statsPanel"><h2>Trang được xem nhiều</h2>{data.topPages.length?data.topPages.map((r,i)=><div className="statsRow" key={r.name}><span>{i+1}. {r.name}</span><strong>{n(r.count)}</strong></div>):<p>Chưa có dữ liệu.</p>}</article>
      <article className="statsPanel"><h2>Nội dung được nghe nhiều</h2>{data.topAudio.length?data.topAudio.map((r,i)=><div className="statsRow" key={r.name}><span>{i+1}. {r.name}</span><strong>{n(r.count)}</strong></div>):<p>Chưa có dữ liệu.</p>}</article>
    </section>
    <section className="statsPanel"><h2>Theo ngày</h2><div className="statsTable"><table><thead><tr><th>Ngày</th><th>Xem</th><th>Người xem</th><th>Nghe</th><th>Người nghe</th><th>≥30s</th><th>Hết</th></tr></thead><tbody>{data.daily.slice().reverse().map(d=><tr key={d.date}><td>{d.date}</td><td>{n(d.views)}</td><td>{n(d.visitors)}</td><td>{n(d.plays)}</td><td>{n(d.listeners)}</td><td>{n(d.listen30)}</td><td>{n(d.complete)}</td></tr>)}</tbody></table></div></section>
    <p className="statsUpdated">Cập nhật: {new Date(data.generatedAt).toLocaleString('vi-VN')}</p>
   </>}
 </main>
}
