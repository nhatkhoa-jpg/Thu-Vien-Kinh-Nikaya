import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:{default:'Thư viện Kinh Nikāya',template:'%s · Thư viện Nikāya'},description:'Thư viện Ngũ Bộ Nikāya đa ngôn ngữ: đọc, nghe, PDF, MP3 và video minh họa.',robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
