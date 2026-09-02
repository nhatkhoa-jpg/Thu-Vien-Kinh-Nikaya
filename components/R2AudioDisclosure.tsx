'use client';

import {useEffect,useState} from 'react';
import {ChevronDown,Download,ExternalLink,Headphones} from 'lucide-react';
import AudioPlayer from '@/components/AudioPlayer';

type Props={src:string;storageKey:string;sourceUrl?:string;vi:boolean};

export default function R2AudioDisclosure({src,storageKey,sourceUrl,vi}:Props){
  const [available,setAvailable]=useState(false);
  useEffect(()=>{
    let live=true;
    fetch(src,{method:'HEAD',cache:'no-store'})
      .then(response=>{if(live)setAvailable(response.ok);})
      .catch(()=>{if(live)setAvailable(false);});
    return()=>{live=false;};
  },[src]);
  if(!available)return null;
  return <details className="essentialDisclosure mp3Disclosure primaryMp3Disclosure" id="mp3-r2">
    <summary title={vi?'Nghe MP3 dựng sẵn, dùng trên mọi thiết bị':'Play the prebuilt MP3 on any device'}>
      <span className="miniActionIcon"><Headphones size={17}/></span>
      <span><strong>{vi?'Nghe bài kinh':'Listen'}</strong><small>{vi?'MP3 VieNeu · mọi thiết bị':'VieNeu MP3 · all devices'}</small></span>
      <ChevronDown size={15} className="disclosureChevron"/>
    </summary>
    <div className="disclosureBody">
      <AudioPlayer src={src} storageKey={storageKey}/>
      <div className="mp3Links">
        <a className="downloadLink" href={src} target="_blank" rel="noreferrer"><Download size={16}/>{vi?'Mở / tải MP3':'Open / download MP3'}</a>
        {sourceUrl&&<a className="audioSource" href={sourceUrl} target="_blank" rel="noreferrer">{vi?'Văn bản đối chiếu':'Text source'}<ExternalLink size={13}/></a>}
      </div>
    </div>
  </details>;
}
