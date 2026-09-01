import Link from 'next/link';

export default function Home(){
  return <main className="shell" style={{padding:'64px 0'}}>
    <meta httpEquiv="refresh" content="0; url=./vi/" />
    <h1 style={{fontSize:42}}>Thư viện Kinh Nikāya</h1>
    <p className="lede">Đang chuyển sang phiên bản Tiếng Việt…</p>
    <Link className="btn btnPrimary" href="/vi">Mở thư viện</Link>
  </main>;
}
