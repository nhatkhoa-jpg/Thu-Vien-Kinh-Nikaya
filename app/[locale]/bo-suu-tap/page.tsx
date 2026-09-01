import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,Bookmark} from 'lucide-react';
import {isLocale,type Locale} from '@/lib/i18n';
import SavedPassagesClient from '@/components/SavedPassagesClient';

export default async function SavedPassagesPage({params}:{params:Promise<{locale:string}>}){
 const {locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale;const vi=locale==='vi';
 return <main className="savedPage"><div className="shell savedShell"><Link className="backLink" href={`/${locale}#library`}><ArrowLeft size={17}/>{vi?'Thư viện':'Library'}</Link><header className="savedHero"><span className="eyebrow"><Bookmark size={15}/>{vi?'BỘ SƯU TẬP CÁ NHÂN':'PERSONAL COLLECTION'}</span><h1>{vi?'Đoạn kinh đã lưu':'Saved passages'}</h1><p>{vi?'Các đoạn này được lưu ngay trên thiết bị hiện tại. Không cần đăng nhập; dữ liệu chưa đồng bộ giữa các máy.':'These passages are stored on this device. No sign-in is required; cross-device sync is not enabled yet.'}</p></header><SavedPassagesClient locale={locale}/></div></main>;
}
