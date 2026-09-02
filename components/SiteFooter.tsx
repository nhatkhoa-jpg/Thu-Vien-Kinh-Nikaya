import Link from 'next/link';
import {BookOpen,ExternalLink,ShieldCheck} from 'lucide-react';
import {dict,type Locale} from '@/lib/i18n';

export default function SiteFooter({locale}:{locale:Locale}){
  const d=dict(locale);const vi=locale==='vi';
  return <footer className="siteFooter">
    <div className="shell siteFooterGrid">
      <div className="siteFooterBrand">
        <span className="siteFooterMark"><BookOpen size={20}/></span>
        <div><strong>{d.brand}</strong><p>{vi?'Thư viện đọc, nghe và lưu giữ kinh điển Nikāya với nguồn đối chiếu rõ ràng.':'A reading, listening and preservation library for the Nikāyas with traceable source references.'}</p></div>
      </div>
      <div className="siteFooterLinks" aria-label={vi?'Thông tin thư viện':'Library information'}>
        <strong>{vi?'Thư viện':'Library'}</strong>
        <Link href={`/${locale}/about`}>{vi?'Giới thiệu':'About'}</Link>
        <Link href={`/${locale}/editorial-policy`}>{vi?'Nguồn & nguyên tắc biên tập':'Sources & editorial policy'}</Link>
        <Link href={`/${locale}/privacy`}>{vi?'Quyền riêng tư':'Privacy'}</Link>
        <Link href={`/${locale}/terms`}>{vi?'Điều khoản sử dụng':'Terms'}</Link>
      </div>
      <div className="siteFooterLinks">
        <strong>{vi?'Đọc & kiểm chứng':'Read & verify'}</strong>
        <Link href={`/${locale}#library`}>{vi?'Tra cứu kinh':'Browse the library'}</Link>
        <Link href={`/${locale}/tien-do`}>{vi?'Tiến độ dữ liệu':'Data progress'}</Link>
        <a href="https://suttacentral.net" target="_blank" rel="noreferrer">SuttaCentral <ExternalLink size={12}/></a>
      </div>
    </div>
    <div className="shell siteFooterBottom"><span><ShieldCheck size={14}/>{vi?'Kinh văn ưu tiên nguồn có thể kiểm tra; AI không được dùng để bịa kinh văn.':'Scripture text prioritizes verifiable sources; AI is not used to invent scripture.'}</span><small>© {new Date().getFullYear()} {d.brand}</small></div>
  </footer>;
}
