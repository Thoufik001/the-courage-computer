'use client';
import {useMemo} from 'react';
import type {ActivitySession} from '@/lib/activity-types';
const dayKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export default function VisitorTrend({sessions}:{sessions:ActivitySession[]}){
 const days=useMemo(()=>{
  const today=new Date();today.setHours(0,0,0,0);
  const buckets=Array.from({length:14},(_,i)=>{const date=new Date(today);date.setDate(date.getDate()-13+i);return {key:dayKey(date),date,visits:0};});
  const byKey=new Map(buckets.map((day,i)=>[day.key,i]));
  for(const session of sessions){
   const visits=session.events.filter(event=>event.type==='visit');
   const seen=visits.length?visits.map(event=>event.at):[session.startedAt];
   for(const at of seen){const index=byKey.get(dayKey(new Date(at)));if(index!==undefined)buckets[index].visits++;}
   const missing=Math.max(0,session.visits-seen.length);const index=byKey.get(dayKey(new Date(session.startedAt)));if(index!==undefined)buckets[index].visits+=missing;
  }
  return buckets;
 },[sessions]);
 const max=Math.max(1,...days.map(day=>day.visits));
 const total=days.reduce((sum,day)=>sum+day.visits,0);
 return <section className="activity-trend" aria-labelledby="visits-trend-title"><div className="activity-trend-heading"><div><span className="activity-eyebrow">OVER TIME</span><h2 id="visits-trend-title">Daily visits</h2><p>Last 14 days · loaded sessions</p></div><strong>{total}<span> visits</span></strong></div><div className="activity-chart-scroll"><div className="activity-chart" role="group" aria-label="Visits on each of the last 14 days"><div className="activity-chart-guide activity-chart-guide-top"/><div className="activity-chart-guide activity-chart-guide-mid"/><div className="activity-chart-guide activity-chart-guide-low"/>{days.map((day,index)=>{const label=day.date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});return <button className="activity-chart-day" key={day.key} type="button" aria-label={`${label}: ${day.visits} ${day.visits===1?'visit':'visits'}`}><span className="activity-chart-tooltip" aria-hidden="true"><strong>{day.visits}</strong> {day.visits===1?'visit':'visits'}<small>{label}</small></span><span className={`activity-chart-bar ${day.visits?'has-visits':''}`} style={{height:`${Math.max(3,day.visits/max*126)}px`}}/><span className="activity-chart-date" aria-hidden="true">{index===0||index===13||index%2===1?day.date.toLocaleDateString(undefined,{month:'short',day:'numeric'}):' '}</span></button>;})}</div></div></section>;
}
