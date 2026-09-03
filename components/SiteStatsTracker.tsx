'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {sendStat} from '@/lib/client-stats';

export default function SiteStatsTracker(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!pathname||pathname.includes('/stats'))return;
    const key=`nikaya:pv:${pathname}`;
    const now=Date.now();
    try{
      const last=Number(sessionStorage.getItem(key)||0);
      if(now-last<30_000)return;
      sessionStorage.setItem(key,String(now));
    }catch{}
    sendStat('page_view');
  },[pathname]);
  return null;
}
