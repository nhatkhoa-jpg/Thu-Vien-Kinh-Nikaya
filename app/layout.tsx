import './globals.css';
import './refinements.css';
import './code-labels.css';
import './product-v3.css';
import './compact-reader.css';
import './mobile-public.css';
import './public-polish-v2.css';
import './site-pages.css';
import './canon.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:{default:'5 Đại Tạng Kinh Nikāya',template:'%s · 5 Đại Tạng Kinh Nikāya'},description:'Thư viện 5 Đại Tạng Kinh Nikāya và Tam Tạng Pāli Theravāda: đọc toàn văn, nghe MP3, tạo PDF, tra cứu nguồn và lưu tiến độ.',robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
