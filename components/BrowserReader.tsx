'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ChevronDown,Pause,Play,RotateCcw,Square,Volume2} from 'lucide-react';

const localeVoice:Record<string,string>={vi:'vi-VN',en:'en-US',zh:'zh-CN',hi:'hi-IN',es:'es-ES',ar:'ar',fr:'fr-FR',bn:'bn',pt:'pt-BR',ru:'ru-RU',id:'id-ID',ur:'ur',de:'de-DE',ja:'ja-JP',ko:'ko-KR',th:'th-TH'};
type ReaderState='idle'|'speaking'|'paused';
type SpeechCopy={title:string;label:string;sub:string;pause:string;resume:string;play:string;stop:string;restart:string;voice:string;speed:string};
const speechCopy:Record<string,SpeechCopy>={
 en:{title:'Read with a voice installed on this device',label:'Device voice',sub:'Available on this device',pause:'Pause',resume:'Resume',play:'Use device voice',stop:'Stop',restart:'Restart',voice:'Voice',speed:'Speed'},
 vi:{title:'Đọc bằng giọng có sẵn trên thiết bị',label:'Đọc bằng máy',sub:'Chỉ hiện khi máy hỗ trợ',pause:'Tạm dừng',resume:'Đọc tiếp',play:'Nghe bằng máy',stop:'Dừng',restart:'Đọc lại',voice:'Giọng',speed:'Tốc độ'},
 zh:{title:'使用本设备已安装的语音朗读',label:'设备朗读',sub:'仅在设备支持时显示',pause:'暂停',resume:'继续',play:'开始朗读',stop:'停止',restart:'重新朗读',voice:'语音',speed:'速度'},
 th:{title:'อ่านด้วยเสียงที่ติดตั้งในอุปกรณ์',label:'เสียงจากอุปกรณ์',sub:'แสดงเมื่ออุปกรณ์รองรับ',pause:'หยุดชั่วคราว',resume:'อ่านต่อ',play:'เริ่มอ่าน',stop:'หยุด',restart:'เริ่มใหม่',voice:'เสียง',speed:'ความเร็ว'},
 my:{title:'စက်တွင်ရှိသော အသံဖြင့် ဖတ်ရန်',label:'စက်အသံ',sub:'စက်ပံ့ပိုးပါကသာ ပြသမည်',pause:'ခဏရပ်',resume:'ဆက်ဖတ်',play:'ဖတ်စတင်',stop:'ရပ်',restart:'ပြန်စ',voice:'အသံ',speed:'အမြန်နှုန်း'},
 si:{title:'උපාංගයේ ඇති හඬකින් කියවන්න',label:'උපාංග හඬ',sub:'උපාංගය සහය දක්වන විට පමණක්',pause:'විරාමය',resume:'නැවත කියවන්න',play:'කියවීම අරඹන්න',stop:'නවත්වන්න',restart:'නැවත අරඹන්න',voice:'හඬ',speed:'වේගය'},
 km:{title:'អានដោយសំឡេងដែលមានក្នុងឧបករណ៍',label:'សំឡេងឧបករណ៍',sub:'បង្ហាញពេលឧបករណ៍គាំទ្រ',pause:'ផ្អាក',resume:'បន្ត',play:'ចាប់ផ្តើមអាន',stop:'បញ្ឈប់',restart:'ចាប់ផ្តើមឡើងវិញ',voice:'សំឡេង',speed:'ល្បឿន'},
 lo:{title:'ອ່ານດ້ວຍສຽງທີ່ມີໃນອຸປະກອນ',label:'ສຽງອຸປະກອນ',sub:'ສະແດງເມື່ອອຸປະກອນຮອງຮັບ',pause:'ພັກ',resume:'ອ່ານຕໍ່',play:'ເລີ່ມອ່ານ',stop:'ຢຸດ',restart:'ເລີ່ມໃໝ່',voice:'ສຽງ',speed:'ຄວາມໄວ'}
};

function prepare(text:string,vi:boolean){
  let value=text.normalize('NFC').replace(/\u00a0/g,' ').replace(/[–—]/g,', ').replace(/\s+/g,' ').trim();
  if(vi)value=value.replace(/\bSC\s*(\d+)\b/gi,'Đoạn $1.').replace(/\bTB\s*(\d+)\b/g,'Trung Bộ $1').replace(/\bMN\s*(\d+)\b/gi,'M N $1');
  return value;
}
function chunks(text:string,vi:boolean,max=220){
  const input=prepare(text,vi);if(!input)return[];
  const out:string[]=[];let current='';
  for(const sentence of input.split(/(?<=[.!?。！？])\s+/)){
    const s=sentence.trim();if(!s)continue;
    if((current+' '+s).trim().length<=max){current=(current+' '+s).trim();continue;}
    if(current)out.push(current);current='';
    if(s.length<=max){current=s;continue;}
    let rest=s;
    while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<max*.55)cut=max;out.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}
    current=rest;
  }
  if(current)out.push(current);return out;
}

export default function BrowserReader({text,locale}:{text:string;locale:string}){
  const vi=locale==='vi';const c=speechCopy[locale]||speechCopy.en;
  const queue=useMemo(()=>chunks(text,vi),[text,vi]);
  const [ready,setReady]=useState(false);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri,setVoiceUri]=useState('');
  const [rate,setRate]=useState(1);
  const [state,setState]=useState<ReaderState>('idle');
  const indexRef=useRef(0);const activeRef=useRef(false);const utteranceRef=useRef<SpeechSynthesisUtterance|null>(null);

  useEffect(()=>{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setReady(true);return;}
    const synth=window.speechSynthesis;const wanted=(localeVoice[locale]||locale).toLowerCase().replace('_','-');const base=wanted.split('-')[0];
    const load=()=>{const matching=synth.getVoices().filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(base));setVoices(matching);setVoiceUri(old=>old&&matching.some(v=>v.voiceURI===old)?old:(matching.find(v=>v.lang.toLowerCase().replace('_','-')===wanted)||matching[0])?.voiceURI||'');};
    load();const timers=[200,800,1800,3000].map(ms=>setTimeout(()=>{load();if(ms===3000)setReady(true);},ms));
    const changed=()=>{load();setReady(true);};synth.addEventListener?.('voiceschanged',changed);
    return()=>{timers.forEach(clearTimeout);synth.removeEventListener?.('voiceschanged',changed);activeRef.current=false;synth.cancel();};
  },[locale]);

  function finish(){activeRef.current=false;utteranceRef.current=null;indexRef.current=0;setState('idle');}
  function speak(index:number){
    if(!activeRef.current||index>=queue.length){finish();return;}
    const synth=window.speechSynthesis;const live=synth.getVoices();const selected=live.find(v=>v.voiceURI===voiceUri)||voices[0];if(!selected){finish();return;}
    const u=new SpeechSynthesisUtterance(queue[index]);u.voice=selected;u.lang=localeVoice[locale]||locale;u.rate=rate;u.pitch=1;u.volume=1;utteranceRef.current=u;
    u.onstart=()=>setState('speaking');u.onend=()=>{if(activeRef.current){indexRef.current=index+1;setTimeout(()=>speak(index+1),80);}};u.onerror=(e:any)=>{if(e?.error!=='canceled'&&e?.error!=='interrupted')finish();};
    synth.speak(u);
  }
  function start(){if(!queue.length||!voiceUri)return;window.speechSynthesis.cancel();activeRef.current=true;indexRef.current=0;speak(0);}
  function toggle(){const synth=window.speechSynthesis;if(state==='speaking'){synth.pause();setState('paused');return;}if(state==='paused'){synth.resume();setState('speaking');return;}start();}
  function stop(){activeRef.current=false;window.speechSynthesis.cancel();utteranceRef.current=null;indexRef.current=0;setState('idle');}
  function restart(){stop();setTimeout(start,80);}

  if(!ready||!voices.length||!voiceUri)return null;
  return <details className="essentialDisclosure listenDisclosure deviceSpeechDisclosure" id="device-speech">
    <summary title={c.title}><span className="miniActionIcon"><Volume2 size={17}/></span><span><strong>{c.label}</strong><small>{c.sub}</small></span><ChevronDown size={15} className="disclosureChevron"/></summary>
    <div className="disclosureBody"><div className="browserReader compactTts deviceOnlyTts">
      <div className="ttsPrimary"><button className="ttsMain" onClick={toggle}>{state==='speaking'?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}{state==='speaking'?c.pause:state==='paused'?c.resume:c.play}</button><button className="ttsIcon" onClick={stop} title={c.stop}><Square size={16}/></button><button className="ttsIcon" onClick={restart} title={c.restart}><RotateCcw size={16}/></button></div>
      <div className="ttsControls"><label><span>{c.voice}</span><select value={voiceUri} onChange={e=>setVoiceUri(e.target.value)}>{voices.map(v=><option value={v.voiceURI} key={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label><label><span>{c.speed}</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}>{[.8,.9,1,1.1,1.25,1.5].map(v=><option value={v} key={v}>{v}×</option>)}</select></label></div>
    </div></div>
  </details>;
}
