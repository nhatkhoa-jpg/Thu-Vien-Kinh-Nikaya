import Link from 'next/link';
import {BookOpen, Search, Headphones, Home, Library} from 'lucide-react';
import {dict,type Locale} from '@/lib/i18n';
import LanguageSelect from './LanguageSelect';

export default function Header({locale}:{locale:Locale}){
  const d=dict(locale);
  return <>
    <header className="topbar">
      <div className="shell nav">
        <Link className="logo" href={`/${locale}`} aria-label={d.brand}>
          <span className="logoMark"><BookOpen size={20}/></span>
          <span className="logoText"><strong>{d.brand}</strong><small>{d.brandSub}</small></span>
        </Link>
        <nav className="desktopNav" aria-label="Primary navigation">
          <Link href={`/${locale}#collections`}>{d.navCollections}</Link>
          <Link href={`/${locale}#library`}>{d.navLibrary}</Link>
          <Link href={`/${locale}#featured`}>{d.navListen}</Link>
        </nav>
        <div className="headerActions">
          <Link className="iconButton desktopOnly" href={`/${locale}#library`} aria-label={d.search}><Search size={19}/></Link>
          <LanguageSelect locale={locale}/>
        </div>
      </div>
    </header>
    <nav className="mobileDock" aria-label="Mobile navigation">
      <Link href={`/${locale}`}><Home size={20}/><span>{d.home}</span></Link>
      <Link href={`/${locale}#collections`}><Library size={20}/><span>{d.navCollections}</span></Link>
      <Link href={`/${locale}#featured`}><Headphones size={20}/><span>{d.navListen}</span></Link>
      <Link href={`/${locale}#library`}><Search size={20}/><span>{d.searchShort}</span></Link>
    </nav>
  </>;
}
