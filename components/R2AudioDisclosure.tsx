'use client';

import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,Download,ExternalLink,Headphones} from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

type AudioCandidate={src:string;label:string;provider:'gemini'|'local'};
type Props={sources:AudioCandidate[];storageKey:string;sourceUrl?:string;vi:boolean};

export default function R2AudioDisclosure({sources,storageKey,sourceUrl,vi}:Props){
  const candidates=useMemo(()=>sources.filter(x=>Boolean(x.src)),[sources]);
  const [selected,setSelected]=useState<AudioCandidate|null>(null);
  useEffect(()=>{
    let live=true;
    setSelected(null);
    (async()=>{
      for(const candidate of candidates){
        try{
          const response=await fetch(candidate.src,{method:'HEAD',cache:'no-store'});
          if(response.ok){if(live)setSelected(candidate);return;}
        }catch{}
      }
      if(live)setSelected(null);
    })();
    return()=>{live=false;};
  },[candidates]);
  if(!selected)return null;
  const bestAvailable=selected.provider==='gemini';
  return <details className="essentialDisclosure mp3Disclosure primaryMp3Disclosure" id="mp3-r2">
    <summary title={vi?'Nghe giọng đọc dựng sẵn, dùng trên mọi thiết bị':'Play the best available prebuilt narration'}>
      <span className="miniActionIcon"><Headphones size={17}/></span>
      <span><strong>{vi?'Nghe bài kinh':'Listen'}</strong><small>{selected.label}</small></span>
      <ChevronDown size={15} className="disclosureChevron"/>
    </summary>
    <div className="disclosureBody">
      <AudioPlayer src={selected.src} storageKey={`${storageKey}:${selected.provider}`}/>
      <div className="mp3Links">
        <a className="downloadLink" href={selected.src} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>
        {sourceUrl&&<a className="audioSource" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Văn bản đối chiếu':'Text source'}<ExternalLink size={13}/></a>}
      </div>
      {!bestAvailable&&<p className="audioFallbackNote">{vi?'Bản giọng đọc chất lượng cao đang được bổ sung. Hiện thư viện dùng MP3 dự phòng đã xác minh; bạn vẫn có thể chọn chức năng đọc bằng trình duyệt bên cạnh.':'Higher-quality narration is still being added. A verified backup MP3 is playing; browser reading remains available as another option.'}</p>}
    </div>
  </details>;
}
