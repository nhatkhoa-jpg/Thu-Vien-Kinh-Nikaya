'use client';

import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {sendStat} from '@/lib/client-stats';

export default function PageViewTracker(){
  const pathname=usePathname();
  const lastPath=useRef<string>('');

  useEffect(()=>{
    if(!pathname||pathname===lastPath.current)return;
    lastPath.current=pathname;
    sendStat('page_view');
  },[pathname]);

  return null;
}
