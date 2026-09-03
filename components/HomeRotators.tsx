'use client';

import Link from 'next/link';
import {ArrowRight,BookOpen,Clock,Play,Quote,Shuffle} from 'lucide-react';
import {useEffect,useState} from 'react';

type HeroItem={slug:string;code:string;intlCode?:string;title:string;summary:string;minutes:number;audio:boolean;collection:string;tone:string;image:string};
type Verse={ref:string;text:string;href:string;tone:string};
type HeroCopy={today:string;read:string;listenRead:string;fullText:string;audioFull:string;choose:string;minutes:string};

export function ScriptureHeroRotator({locale,items,copy}:{locale:string;items:HeroItem[];copy:HeroCopy}){
  const [index,setIndex]=useState(0);
  useEffect(()=>{if(items.length<2)return;const timer=window.setInterval(()=>setIndex(i=>(i+1)%items.length),8500);return()=>window.clearInterval(timer)},[items.length]);
  if(!items.length)return null;const item=items[index];
  return <aside className={`heroFocus rotatingHero ${item.tone}`}>
    <div className="heroArtwork" style={{backgroundImage:`url(${item.image})`}} aria-hidden="true"/>
    <div className="heroImageShade" aria-hidden="true"/>
    <div className="heroFocusContent">
      <div className="heroFocusTop"><span className="focusBadge dualCode"><strong>{item.code}</strong>{item.intlCode&&<small>{item.intlCode}</small>}</span><span className="heroCollection">{item.collection}</span><span className="miniMeta"><Clock size={14}/>{item.minutes} {copy.minutes}</span></div>
      <div className="heroCopy"><p className="kicker">{copy.today}</p><h2>{item.title}</h2><p>{item.summary}</p></div>
      <Link className="focusAction" href={`/${locale}/library/${item.slug}`}><span className="playCircle">{item.audio?<Play size={18} fill="currentColor"/>:<BookOpen size={18}/>}</span><span><strong>{item.audio?copy.listenRead:copy.read}</strong><small>{item.audio?copy.audioFull:copy.fullText}</small></span><ArrowRight size={18}/></Link>
      <div className="rotatorDots" aria-label={copy.choose}>{items.map((x,i)=><button key={x.slug} aria-label={`${copy.choose} ${i+1}`} aria-current={i===index} onClick={()=>setIndex(i)}/>)}</div>
    </div>
  </aside>
}

export function DhammapadaRotator({verses}:{verses:Verse[]}){
  const [index,setIndex]=useState(0);const verse=verses[index];
  useEffect(()=>{if(verses.length<2)return;const timer=window.setInterval(()=>setIndex(i=>(i+1)%verses.length),11000);return()=>window.clearInterval(timer)},[verses.length]);
  const next=()=>setIndex(i=>(i+1)%verses.length);
  if(!verse)return null;
  return <section className={`canonPromo rotatingVerse ${verse.tone}`} aria-live="polite">
    <div className="verseArtwork" aria-hidden="true"/>
    <div className="canonPromoCopy"><p className="kicker"><Quote size={18}/> LỜI KINH ĐỂ GHI NHỚ</p><h2>“{verse.text}”</h2><p>{verse.ref} · một câu ngắn để mang theo trong ngày.</p><div className="verseActions"><Link href={verse.href}>Đọc thêm trong Tiểu Bộ <ArrowRight size={16}/></Link><button onClick={next}><Shuffle size={16}/> Câu khác</button></div></div>
    <div className="rotatorDots verseDots">{verses.map((v,i)=><button key={v.ref} aria-label={v.ref} aria-current={i===index} onClick={()=>setIndex(i)}/>)}</div>
  </section>
}
