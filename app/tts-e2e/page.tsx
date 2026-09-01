import {notFound} from 'next/navigation';
import BrowserReader from '@/components/BrowserReader';

export const dynamic='force-dynamic';

export default function TtsE2EPage(){
  if(process.env.TTS_E2E!=='1')notFound();
  const sample=[
    'Đây là bài kiểm tra giọng đọc tiếng Việt của thư viện. Người nghe phải hiểu rõ từng từ và tốc độ phải tự nhiên.',
    'Đoạn thứ hai dùng để kiểm tra hệ thống có tiếp tục đọc sau khi đoạn đầu kết thúc hay không, không được dừng hoặc báo lỗi.',
    'Đoạn thứ ba kiểm tra bộ nhớ và hàng đợi tạo âm thanh. Trình duyệt phải phát liên tục mà không cần giọng đọc của thiết bị.',
    'Đoạn cuối kiểm tra thao tác dừng và đọc tiếp. Khi người dùng dừng giữa chừng rồi đọc tiếp, âm thanh phải tiếp tục tại vị trí cũ.'
  ].join(' ');
  return <main style={{maxWidth:720,margin:'40px auto',padding:20}}>
    <h1>V4.11.2 TTS E2E</h1>
    <BrowserReader text={sample} locale="vi" chunkMax={120}/>
  </main>;
}
