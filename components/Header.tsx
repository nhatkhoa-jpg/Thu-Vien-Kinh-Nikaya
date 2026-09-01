import Link from 'next/link';
import {BookOpen} from 'lucide-react';
import {dict,type Locale} from '@/lib/i18n';
import LanguageSelect from './LanguageSelect';
export default function Header({locale}:{locale:Locale}){const d=dict(locale);return <header className="topbar"><div className="shell nav"><Link className="logo" href={`/${locale}`}><span className="logoMark"><BookOpen size={20}/></span><span>{d.brand}</span></Link><nav className="navlinks"><a href="#library">{d.navLibrary}</a><a href="#listen">{d.navListen}</a><a href="#topics">{d.navTopics}</a></nav><LanguageSelect locale={locale}/></div></header>}
