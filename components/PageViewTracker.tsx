'use client';
import {useEffect} from 'react';
import {sendAnalyticsEvent} from '@/lib/analytics';

export default function PageViewTracker({refId,locale}:{refId:string;locale:string}){
  useEffect(()=>{sendAnalyticsEvent('view',refId,locale);},[refId,locale]);
  return null;
}
