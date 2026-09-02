const base='https://github.com/nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya/releases/download/cloud-tts-vi-test-v1';
const voices=[
  {name:'Chirp 3 HD · Aoede',desc:'Ưu tiên chất lượng tự nhiên cao',file:'chirp3-hd-aoede.mp3'},
  {name:'Neural2 · A',desc:'Giọng neural cân bằng',file:'neural2-a.mp3'},
  {name:'WaveNet · A',desc:'Quota miễn phí lớn, phù hợp render số lượng nhiều',file:'wavenet-a.mp3'},
];

export default async function VoiceTestPage(){
  return <main style={{maxWidth:880,margin:'0 auto',padding:'28px 18px 64px'}}>
    <section style={{marginBottom:24}}>
      <p style={{fontSize:13,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',opacity:.65,marginBottom:8}}>Thử giọng đọc Cloud TTS</p>
      <h1 style={{fontSize:'clamp(28px,6vw,44px)',lineHeight:1.08,margin:'0 0 12px'}}>So sánh 3 giọng Google tiếng Việt</h1>
      <p style={{fontSize:17,lineHeight:1.65,opacity:.78,maxWidth:720}}>Cùng một đoạn văn được đọc bằng ba dòng giọng khác nhau. Bấm Play từng mẫu và chọn giọng nghe tự nhiên, phát âm rõ, ngắt câu hợp lý nhất.</p>
    </section>
    <div style={{display:'grid',gap:16}}>
      {voices.map((v,i)=><article key={v.file} style={{border:'1px solid rgba(127,127,127,.28)',borderRadius:18,padding:18,background:'rgba(127,127,127,.06)'}}>
        <div style={{display:'flex',gap:12,alignItems:'baseline',flexWrap:'wrap',marginBottom:10}}>
          <span style={{fontSize:13,fontWeight:800,opacity:.58}}>MẪU {i+1}</span>
          <h2 style={{fontSize:22,margin:0}}>{v.name}</h2>
        </div>
        <p style={{margin:'0 0 14px',opacity:.72}}>{v.desc}</p>
        <audio controls preload="metadata" style={{width:'100%'}} src={`${base}/${v.file}`}>Trình duyệt của bạn không hỗ trợ audio.</audio>
        <p style={{fontSize:13,opacity:.58,margin:'12px 0 0'}}>File: {v.file}</p>
      </article>)}
    </div>
    <section style={{marginTop:24,padding:18,borderRadius:16,background:'rgba(127,127,127,.08)'}}>
      <strong>Đoạn thử</strong>
      <p style={{lineHeight:1.75,marginBottom:0}}>Này các Tỷ-kheo, có hai cực đoan mà người xuất gia không nên thực hành. Một là đắm mình trong dục lạc, thấp kém và không đưa đến lợi ích. Hai là tự hành khổ mình, đau khổ và cũng không đưa đến lợi ích. Từ bỏ hai cực đoan ấy, Như Lai đã chứng ngộ con đường Trung đạo, con đường đưa đến an tịnh, thắng trí, giác ngộ và Niết-bàn.</p>
    </section>
  </main>
}
