import './globals.css';
import './refinements.css';
import './code-labels.css';
import './product-v3.css';
import './compact-reader.css';
import './mobile-public.css';
import './public-polish-v2.css';
import './site-pages.css';
import './canon.css';
import './stats.css';
import './high-contrast-ui.css';
import './buddhist-home.css';
import './sitewide-buddhist.css';
import './sitewide-buddhist-extras.css';
import './qa-readability-fixes.css';
import type {Metadata} from 'next';
import SiteStatsTracker from '@/components/SiteStatsTracker';

export const metadata:Metadata={title:{default:'Thư Viện Tam Tạng Pāli – Phật Giáo Theravāda',template:'%s · Thư Viện Tam Tạng Pāli'},description:'Thư viện Tam Tạng Pāli Theravāda: Kinh Tạng, Luật Tạng và Vi Diệu Pháp; đọc toàn văn, nghe MP3, tạo PDF, tra cứu nguồn và lưu tiến độ.',robots:{index:true,follow:true},icons:{icon:'/icon.svg',shortcut:'/icon.svg'}};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="vi"><body><SiteStatsTracker/>{children}</body></html>
}
