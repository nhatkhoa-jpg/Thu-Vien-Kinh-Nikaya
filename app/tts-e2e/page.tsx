import {notFound} from 'next/navigation';
import BrowserReader from '@/components/BrowserReader';

export const dynamic='force-dynamic';

export default function TtsE2EPage(){
  if(process.env.TTS_E2E!=='1')notFound();
  const sample='Đây là bài kiểm tra giọng đọc tiếng Việt của thư viện. Người nghe phải hiểu rõ từng từ, tốc độ tự nhiên, không quá nhanh và không quá chậm.';
  return <main style={{maxWidth:720,margin:'40px auto',padding:20}}>
    <h1>V4.11 TTS E2E</h1>
    <BrowserReader text={sample} locale="vi"/>
  </main>;
}
