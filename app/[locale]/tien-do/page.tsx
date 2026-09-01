import Link from 'next/link';
import {Activity,CheckCircle2,Clock3,ExternalLink,Headphones,LoaderCircle} from 'lucide-react';
import {isLocale,type Locale} from '@/lib/i18n';
import {notFound} from 'next/navigation';

export const dynamic='force-dynamic';

const repo='nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya';
const api=`https://api.github.com/repos/${repo}`;

type Run={id:number;name:string;display_title:string;status:string;conclusion:string|null;html_url:string;created_at:string;updated_at:string;head_branch:string};
type ReleaseAsset={name:string};

type CollectionProgress={code:string;vi:string;en:string;tag:string;target:number|null};
const specs:CollectionProgress[]=[
  {code:'MN',vi:'Trung Bộ',en:'Middle Discourses',tag:'mn-vi-audio-v1',target:152},
  {code:'DN',vi:'Trường Bộ',en:'Long Discourses',tag:'dn-vi-audio-v1',target:34},
  {code:'SN',vi:'Tương Ưng Bộ',en:'Connected Discourses',tag:'sn-vi-audio-v1',target:null},
  {code:'AN',vi:'Tăng Chi Bộ',en:'Numbered Discourses',tag:'an-vi-audio-v1',target:null},
  {code:'KN',vi:'Tiểu Bộ',en:'Minor Collection',tag:'kn-vi-audio-v1',target:null},
];

async function gh<T>(path:string):Promise<T|null>{
  try{
    const r=await fetch(`${api}${path}`,{headers:{Accept:'application/vnd.github+json','User-Agent':'Nikaya-Progress/1.0'},cache:'no-store'});
    if(!r.ok)return null;
    return await r.json() as T;
  }catch{return null;}
}

async function mp3Count(tag:string){
  const release=await gh<{id:number}>(`/releases/tags/${tag}`);
  if(!release)return 0;
  let count=0;
  for(let page=1;page<=4;page++){
    const assets=await gh<ReleaseAsset[]>(`/releases/${release.id}/assets?per_page=100&page=${page}`);
    if(!assets?.length)break;
    count+=assets.filter(a=>a.name.endsWith('.mp3')).length;
    if(assets.length<100)break;
  }
  return count;
}

export default async function ProgressPage({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale;const vi=locale==='vi';
  const runsData=await gh<{workflow_runs:Run[]}>(`/actions/runs?per_page=12`);
  const runs=runsData?.workflow_runs||[];
  const active=runs.filter(r=>r.status==='queued'||r.status==='in_progress');
  const counts=await Promise.all(specs.map(s=>mp3Count(s.tag)));
  const latest=runs[0];
  return <main className="progressPage"><div className="shell progressShell">
    <div className="progressHero"><div><span className="eyebrow">{vi?'TIẾN ĐỘ SỐ HÓA':'DIGITIZATION PROGRESS'}</span><h1>{vi?'5 Đại Tạng Kinh Nikāya':'Five Nikāya Collections'}</h1><p>{vi?'Trang này đọc trực tiếp trạng thái GitHub. Nếu có batch đang chạy, bạn sẽ thấy ngay ở đây.':'This page reads the live GitHub build status.'}</p></div><a className="btn btnGhost" href={`https://github.com/${repo}/actions`} target="_blank" rel="noreferrer"><Activity size={17}/>{vi?'Mở GitHub Actions':'Open GitHub Actions'}<ExternalLink size={14}/></a></div>

    <section className={`liveWork ${active.length?'isRunning':'isIdle'}`}><div className="liveIcon">{active.length?<LoaderCircle className="spin" size={22}/>:<Clock3 size={22}/>}</div><div><strong>{active.length?(vi?'Đang có công việc chạy thật':'Work is running now'):(vi?'Hiện không có job GitHub đang chạy':'No GitHub job is running right now')}</strong><p>{active.length?active.map(r=>r.name).join(' · '):(vi?'Tác vụ tự động sẽ tiếp tục từ checkpoint; khi một workflow bắt đầu, trạng thái sẽ đổi ngay.':'Automation will resume from the latest checkpoint.')}</p></div></section>

    <div className="progressGrid">{specs.map((s,i)=>{const count=counts[i];const done=s.target!==null&&count>=s.target;const pct=s.target?Math.min(100,Math.round(count/s.target*100)):0;return <article className="progressCard" key={s.code}><div className="progressCardTop"><span className="progressCode">{s.code}</span>{done?<CheckCircle2 size={20}/>:<Headphones size={20}/>}</div><h2>{vi?s.vi:s.en}</h2><strong className="progressNumber">{s.target!==null?`${count}/${s.target} MP3`:(count?`${count} MP3`:(vi?'Đang chuẩn bị':'Preparing'))}</strong>{s.target!==null&&<div className="progressBar" aria-label={`${pct}%`}><span style={{width:`${pct}%`}}/></div>}<small>{done?(vi?'Hoàn tất MP3':'MP3 complete'):(count?(vi?'Đang dựng MP3':'Rendering MP3'):(vi?'Chưa có release MP3':'No MP3 release yet'))}</small></article>})}</div>

    <section className="recentRuns"><div className="sectionHead"><div><h2>{vi?'Hoạt động gần đây':'Recent activity'}</h2><p>{vi?'Các workflow mới nhất của dự án.':'Latest project workflows.'}</p></div></div><div className="runList">{runs.slice(0,8).map(r=><a href={r.html_url} target="_blank" rel="noreferrer" key={r.id}><span className={`runDot ${r.status}`}/><span><strong>{r.name}</strong><small>{r.display_title} · {r.head_branch}</small></span><em>{r.status==='completed'?(r.conclusion||'done'):r.status}</em></a>)}</div>{latest&&<p className="progressUpdated">{vi?'GitHub cập nhật gần nhất':'Latest GitHub update'}: {new Date(latest.updated_at).toLocaleString(vi?'vi-VN':'en-US',{timeZone:'Asia/Ho_Chi_Minh'})}</p>}</section>
    <Link className="backProgress" href={`/${locale}`}>{vi?'← Về trang chủ':'← Back home'}</Link>
  </div></main>;
}
