'use client';

import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,BookOpen,Flame,Headphones,Sparkles} from 'lucide-react';

type Item={slug:string;code:string;title:string;collection:string;hasAudio?:boolean};
type Props={locale:string;currentSlug:string;collection:string;currentCode:string;currentTitle:string;coverUrl:string;translator?:string;recommended:Item[];next?:Item|null};

type StatsPage={name:string;count:number;title?:string};

const labels:Record<string,{info:string,popular:string,recommended:string,next:string,translator:string,collection:string,read:string,views:string}>={
 vi:{info:'Thông tin bài kinh',popular:'Đang được đọc nhiều',recommended:'Bài kinh hay nên đọc tiếp',next:'Bài kế tiếp',translator:'Dịch giả',collection:'Bộ kinh',read:'Đọc ngay',views:'lượt xem'},
 en:{info:'Discourse information',popular:'Popular with readers',recommended:'Recommended next',next:'Next discourse',translator:'Translator',collection:'Collection',read:'Read now',views:'views'},
 zh:{info:'经文信息',popular:'热门阅读',recommended:'推荐继续阅读',next:'下一篇',translator:'译者',collection:'部类',read:'立即阅读',views:'次浏览'},
 th:{info:'ข้อมูลพระสูตร',popular:'นิยมอ่าน',recommended:'แนะนำให้อ่านต่อ',next:'พระสูตรถัดไป',translator:'ผู้แปล',collection:'หมวด',read:'อ่านเลย',views:'ครั้ง'},
 my:{info:'သုတ်တော်အချက်အလက်',popular:'လူဖတ်များ',recommended:'ဆက်ဖတ်ရန်အကြံပြု',next:'နောက်သုတ်တော်',translator:'ဘာသာပြန်',collection:'ကျမ်းစု',read:'ဖတ်မည်',views:'ကြည့်ရှု'},
 si:{info:'සූත්‍ර තොරතුරු',popular:'වැඩිපුර කියවූ',recommended:'ඊළඟට කියවන්න',next:'ඊළඟ සූත්‍රය',translator:'පරිවර්තක',collection:'නිකාය',read:'දැන් කියවන්න',views:'බැලීම්'},
 km:{info:'ព័ត៌មានសូត្រ',popular:'កំពុងពេញនិយម',recommended:'ណែនាំឲ្យអានបន្ត',next:'សូត្របន្ទាប់',translator:'អ្នកបកប្រែ',collection:'ក្រុម',read:'អានឥឡូវ',views:'មើល'},
 lo:{info:'ຂໍ້ມູນພຣະສູດ',popular:'ອ່ານຫຼາຍ',recommended:'ແນະນຳໃຫ້ອ່ານຕໍ່',next:'ພຣະສູດຖັດໄປ',translator:'ຜູ້ແປ',collection:'ໝວດ',read:'ອ່ານເລີຍ',views:'ເທື່ອ'},
};

export default function ReaderRetentionSidebar(p:Props){
 const l=labels[p.locale]||labels.en; const [popular,setPopular]=useState<StatsPage[]>([]);
 useEffect(()=>{let alive=true;fetch('/api/stats?days=30').then(r=>r.ok?r.json():null).then(data=>{if(!alive||!data?.topPages)return;const rows=(data.topPages as StatsPage[]).filter(x=>x.name.includes('/library/')&&!x.name.endsWith('/'+p.currentSlug)).slice(0,4);setPopular(rows)}).catch(()=>{});return()=>{alive=false}},[p.currentSlug]);
 const popularItems=useMemo(()=>popular.map(row=>{const slug=row.name.split('/library/')[1]?.split(/[?#]/)[0]||'';return{...row,slug}}).filter(x=>x.slug),[popular]);
 return <aside className="readerRetention" aria-label={l.info}>
   <section className="retentionBookCard">
     <img src={p.coverUrl} alt={`${p.collection} book cover`} className="retentionBookCover"/>
     <div><span>{p.currentCode}</span><h3>{p.currentTitle}</h3><p><strong>{l.collection}:</strong> {p.collection}</p>{p.translator&&<p><strong>{l.translator}:</strong> {p.translator}</p>}</div>
   </section>
   {popularItems.length>0&&<section className="retentionCard"><h3><Flame size={18}/>{l.popular}</h3><div className="retentionList">{popularItems.map(x=><Link href={`/${p.locale}/library/${x.slug}`} key={x.slug}><span className="retentionRank">{x.count}</span><div><strong>{x.title||x.slug.replace(/-/g,' ').toUpperCase()}</strong><small>{x.count} {l.views}</small></div><ArrowRight size={16}/></Link>)}</div></section>}
   <section className="retentionCard"><h3><Sparkles size={18}/>{l.recommended}</h3><div className="retentionList">{p.recommended.slice(0,4).map(x=><Link href={`/${p.locale}/library/${x.slug}`} key={x.slug}><span className="retentionIcon"><BookOpen size={16}/></span><div><strong>{x.code} · {x.title}</strong><small>{x.collection}{x.hasAudio?' · audio':''}</small></div>{x.hasAudio&&<Headphones size={15}/>}<ArrowRight size={16}/></Link>)}</div></section>
   {p.next&&<section className="retentionNext"><span>{l.next}</span><strong>{p.next.code} · {p.next.title}</strong><Link href={`/${p.locale}/library/${p.next.slug}`}>{l.read}<ArrowRight size={16}/></Link></section>}
 </aside>
}
