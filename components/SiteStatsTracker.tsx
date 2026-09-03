'use client';
import {useEffect} from'react';
import {usePathname} from'next/navigation';
import {sendStat} from'@/lib/client-stats';
export default function SiteStatsTracker(){const pathname=usePathname();useEffect(()=>{if(!pathname||pathname.includes('/stats'))return;const key=`nikaya:pv:${pathname}`,now=Date.now();try{const last=Number(sessionStorage.getItem(key)||0);if(now-last<30_000)return;sessionStorage.setItem(key,String(now))}catch{}sendStat('page_view');let engaged=false,s50=false,s90=false;const timer=setTimeout(()=>{engaged=true;sendStat('engaged',{seconds:30})},30_000);const scroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(max<=0)return;const p=scrollY/max;if(p>=.5&&!s50){s50=true;sendStat('scroll_50')}if(p>=.9&&!s90){s90=true;sendStat('scroll_90')}};addEventListener('scroll',scroll,{passive:true});return()=>{clearTimeout(timer);removeEventListener('scroll',scroll);void engaged}},[pathname]);return null}
