import Link from 'next/link';
import {Activity,BookOpen,Headphones,Home,Library,Search} from 'lucide-react';
import {type Locale} from '@/lib/i18n';
import {publicUi} from '@/lib/public-ui';
import LanguageSelect from './LanguageSelect';
import HeaderTools from './HeaderTools';

export default function Header({locale}:{locale:Locale}){
  const u=publicUi(locale);
  return <>
    <header className="topbar">
      <div className="shell nav">
        <Link className="logo" href={`/${locale}`} aria-label={u.brand}>
          <span className="logoMark"><BookOpen size={20}/></span>
          <span className="logoText"><strong>{u.brand}</strong><small>{u.brandSub}</small></span>
        </Link>
        <nav className="desktopNav" aria-label={u.primaryNav}>
          <Link href={`/${locale}`}>{u.home}</Link>
          <Link href={`/${locale}#collections`}>{u.collections}</Link>
          <Link href={`/${locale}/tam-tang`}>{u.canon}</Link>
          <Link href={`/${locale}#library`}>{u.library}</Link>
          <Link href={`/${locale}#featured`}>{u.listen}</Link>
          <Link href={`/${locale}/tien-do`}><Activity size={14}/>{u.progress}</Link>
        </nav>
        <div className="headerActions">
          <HeaderTools locale={locale}/>
          <LanguageSelect locale={locale}/>
        </div>
      </div>
    </header>
    <nav className="mobileDock" aria-label={u.mobileNav}>
      <Link href={`/${locale}`}><Home size={20}/><span>{u.home}</span></Link>
      <Link href={`/${locale}#collections`}><Library size={20}/><span>{u.collections}</span></Link>
      <Link href={`/${locale}#featured`}><Headphones size={20}/><span>{u.listen}</span></Link>
      <Link href={`/${locale}#library`}><Search size={20}/><span>{u.search}</span></Link>
    </nav>
  </>;
}
