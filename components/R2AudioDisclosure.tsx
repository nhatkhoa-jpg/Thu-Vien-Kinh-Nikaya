'use client';

import {useEffect,useMemo,useState} from 'react';
import {ChevronDown,Download,ExternalLink,Headphones} from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

type AudioCandidate={src:string;label:string;provider:'local';downloadUrl?:string;manifestUrl?:string};
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
  return <details className="essentialDisclosure mp3Disclosure fallbackMp3Disclosure" id="mp3-local">
    <summary title={vi?'Nghe bản MP3 thư viện dự phòng':'Play the library MP3 fallback'}>
      <span className="miniActionIcon"><Headphones size={17}/></span>
      <span><strong>{vi?'MP3 thư viện':'Library MP3'}</strong><small>{selected.label}</small></span>
      <ChevronDown size={15} className="disclosureChevron"/>
    </summary>
    <div className="disclosureBody">
      <AudioPlayer src={selected.src} manifestUrl={selected.manifestUrl} storageKey={`${storageKey}:local`}/>
      <div className="mp3Links">
        <a className="downloadLink" href={selected.downloadUrl||selected.src} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>
        {sourceUrl&&<a className="audioSource" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Văn bản đối chiếu':'Text source'}<ExternalLink size={13}/></a>}
      </div>
      <p className="audioFallbackNote">{vi?'Đây là lựa chọn dự phòng. Nếu chưa có giọng Google Cloud chất lượng cao, nên ưu tiên chức năng Đọc bằng máy ở phía trên.':'This is a fallback option. If high-quality Google Cloud narration is unavailable, prefer the device/browser voice above.'}</p>
    </div>
  </details>;
}
