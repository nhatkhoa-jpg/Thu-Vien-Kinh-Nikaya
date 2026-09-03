import Link from 'next/link';
import {BookOpen,ExternalLink,ShieldCheck} from 'lucide-react';
import {type Locale} from '@/lib/i18n';
import {publicUi} from '@/lib/public-ui';

export default function SiteFooter({locale}:{locale:Locale}){
  const u=publicUi(locale);
  return <footer className="siteFooter">
    <div className="shell siteFooterGrid">
      <div className="siteFooterBrand">
        <span className="siteFooterMark"><BookOpen size={20}/></span>
        <div><strong>{u.brand}</strong><p>{u.footerDescription}</p></div>
      </div>
      <div className="siteFooterLinks" aria-label={u.libraryInfo}>
        <strong>{u.libraryInfo}</strong>
        <Link href={`/${locale}/tam-tang`}>{u.canon}</Link>
        <Link href={`/${locale}/about`}>{u.about}</Link>
        <Link href={`/${locale}/editorial-policy`}>{u.editorial}</Link>
        <Link href={`/${locale}/privacy`}>{u.privacy}</Link>
        <Link href={`/${locale}/terms`}>{u.terms}</Link>
      </div>
      <div className="siteFooterLinks">
        <strong>{u.readVerify}</strong>
        <Link href={`/${locale}#library`}>{u.browse}</Link>
        <Link href={`/${locale}/tien-do`}>{u.dataProgress}</Link>
        <a href="https://suttacentral.net" target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={12}/></a>
        <a href="https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/issues" target="_blank" rel="noreferrer">{u.reportCorrection} <ExternalLink size={12}/></a>
      </div>
    </div>
    <div className="shell siteFooterBottom"><span><ShieldCheck size={14}/>{u.integrity}</span><small>© {new Date().getFullYear()} {u.brand}</small></div>
  </footer>;
}
