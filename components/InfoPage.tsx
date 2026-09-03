import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowLeft,BookOpen,ExternalLink,ShieldCheck,ScrollText,Landmark} from 'lucide-react';
import {publicUi} from '@/lib/public-ui';
import {infoCopy} from '@/lib/info-copy';
import type {Locale} from '@/lib/i18n';
import {SITE_URL} from '@/lib/site';

type Kind='about'|'privacy'|'terms'|'editorial-policy';

export function infoMetadata(kind:Kind,locale:Locale):Metadata{
  const c=infoCopy(kind,locale);return{title:c.title,description:c.lead,alternates:{canonical:`${SITE_URL}/${locale}/${kind}`},openGraph:{title:c.title,description:c.lead,url:`${SITE_URL}/${locale}/${kind}`,type:'website'}};
}

export default function InfoPage({locale,kind}:{locale:Locale;kind:Kind}){
  const u=publicUi(locale);const c=infoCopy(kind,locale);
  return <main className={`infoPage sacredInfoPage info-${kind}`}><div className="shell infoShell">
    <Link className="infoBack" href={`/${locale}`}><ArrowLeft size={16}/>{c.back}</Link>
    <header className="infoHero sacredInfoHero"><div className="infoHeroArtwork" aria-hidden="true"/><span className="infoIcon"><BookOpen size={24}/></span><div className="infoHeroText"><p className="kicker">{u.brand}</p><h1>{c.title}</h1><p>{c.lead}</p><div className="infoHeroBadges"><span><ShieldCheck size={15}/>{c.transparency}</span><span><ScrollText size={15}/>{u.readVerify}</span></div></div></header>
    <div className="infoGrid sacredInfoGrid"><article>{c.sections.map(([title,body],index)=><section className="infoSectionCard" key={title}><span className="infoSectionNumber">{String(index+1).padStart(2,'0')}</span><div><h2>{title}</h2><p>{body}</p></div></section>)}</article><aside><div className="infoTrust"><ShieldCheck size={20}/><strong>{c.transparency}</strong><p>{c.transparencyBody}</p></div><div className="infoReferenceArt"><Landmark size={24}/><strong>{u.readVerify}</strong><small>{u.integrity}</small></div><a className="infoSourceLink" href="https://suttacentral.net" target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={14}/></a></aside></div>
  </div></main>;
}
