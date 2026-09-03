'use client';

import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,Download,ExternalLink,Headphones} from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

type AudioCandidate={src:string;label:string;provider:'gemini'|'local';downloadUrl?:string;manifestUrl?:string;trustedFallback?:boolean};
type Props={sources:AudioCandidate[];storageKey:string;sourceUrl?:string;vi:boolean};

export default function R2AudioDisclosure({sources,storageKey,sourceUrl,vi}:Props){
  const candidates=useMemo(()=>sources.filter(x=>Boolean(x.src)),[sources]);
  const trustedFallback=useMemo(()=>candidates.find(x=>x.trustedFallback)||null,[candidates]);
  const [selected,setSelected]=useState<AudioCandidate|null>(trustedFallback);
  useEffect(()=>{
    let live=true;
    setSelected(trustedFallback);
    (async()=>{
      for(const candidate of candidates){
        if(candidate.trustedFallback)continue;
        try{
          const response=await fetch(candidate.src,{method:'HEAD',cache:'no-store'});
          if(response.ok){if(live)setSelected(candidate);return;}
        }catch{}
      }
      if(live)setSelected(trustedFallback);
    })();
    return()=>{live=false;};
  },[candidates,trustedFallback]);
  if(!selected)return null;
  const bestAvailable=selected.provider==='gemini';
  return <details className="essentialDisclosure mp3Disclosure primaryMp3Disclosure" id="mp3-r2">
    <summary title={vi?'Nghe giọng đọc dựng sẵn, dùng trên mọi thiết bị':'Play the best available prebuilt narration'}>
      <span className="miniActionIcon"><Headphones size={17}/></span>
      <span><strong>{vi?'Nghe bài kinh':'Listen'}</strong><small>{selected.label}</small></span>
      <ChevronDown size={15} className="disclosureChevron"/>
    </summary>
    <div className="disclosureBody">
      <AudioPlayer src={selected.src} manifestUrl={selected.manifestUrl} storageKey={`${storageKey}:${selected.provider}`}/>
      <div className="mp3Links">
        <a className="downloadLink" href={selected.downloadUrl||selected.src} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>
        {sourceUrl&&<a className="audioSource" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Văn bản đối chiếu':'Text source'}<ExternalLink size={13}/></a>}
      </div>
      {!bestAvailable&&<p className="audioFallbackNote">{vi?'Giọng đọc chất lượng cao đang được bổ sung. Bản MP3 hiện tại vẫn nghe bình thường; bạn cũng có thể dùng chức năng đọc bằng trình duyệt.':'Higher-quality narration is still being added. The current MP3 remains available, and browser reading is another option.'}</p>}
    </div>
  </details>;
}
