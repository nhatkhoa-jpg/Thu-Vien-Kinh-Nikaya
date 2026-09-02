import Link from 'next/link';
import {Activity,BookOpen,Headphones,Home,Library,Search} from 'lucide-react';
import {dict,type Locale} from '@/lib/i18n';
import LanguageSelect from './LanguageSelect';
import HeaderTools from './HeaderTools';

export default function Header({locale}:{locale:Locale}){
  const d=dict(locale);const vi=locale==='vi';
  return <>
    <header className="topbar">
      <div className="shell nav">
        <Link className="logo" href={`/${locale}`} aria-label={d.brand}>
          <span className="logoMark"><BookOpen size={20}/></span>
          <span className="logoText"><strong>{d.brand}</strong><small>{d.brandSub}</small></span>
        </Link>
        <nav className="desktopNav" aria-label="Primary navigation">
          <Link href={`/${locale}`}>{d.home}</Link>
          <Link href={`/${locale}#collections`}>{d.navCollections}</Link>
          <Link href={`/${locale}#library`}>{vi?'Tìm kinh':d.navLibrary}</Link>
          <Link href={`/${locale}#featured`}>{d.navListen}</Link>
          <Link href={`/${locale}/tien-do`}><Activity size={14}/>{vi?'Tiến độ thư viện':'Progress'}</Link>
        </nav>
        <div className="headerActions">
          <HeaderTools locale={locale}/>
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
