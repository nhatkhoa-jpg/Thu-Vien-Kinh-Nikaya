import './globals.css';
import './refinements.css';
import './code-labels.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:{default:'5 Đại Tạng Kinh Nikāya',template:'%s · 5 Đại Tạng Kinh Nikāya'},description:'Thư viện 5 Đại Tạng Kinh Nikāya đa ngôn ngữ: đọc, nghe, tải PDF/EPUB, MP3 và lưu tiến độ.',robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
