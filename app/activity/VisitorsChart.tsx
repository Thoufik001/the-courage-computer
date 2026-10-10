'use client';
import {useState} from 'react';
import type {ActivityEvent} from '@/lib/activity';

export default function VisitorsChart({visits}:{visits:ActivityEvent[]}){
  const [hovered,setHovered]=useState<number|null>(null);
  const today=new Date();today.setUTCHours(0,0,0,0);
  const days=Array.from({length:30},(_,index)=>{const date=new Date(today);date.setUTCDate(today.getUTCDate()-29+index);return date});
  const counts=days.map(date=>new Set(visits.filter(visit=>new Date(visit.at).toISOString().slice(0,10)===date.toISOString().slice(0,10)).map(visit=>visit.session)).size);
  const highest=Math.max(1,...counts);
  const points=counts.map((count,index)=>`${(index/29*1000).toFixed(1)},${(190-count/highest*165).toFixed(1)}`);
  const line=`M ${points.join(' L ')}`;
  const fill=`${line} L 1000,190 L 0,190 Z`;
  const dateLabel=(date:Date)=>date.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  return <section className="visitors-chart" aria-label="Daily unique visitors in the last 30 days"><div className="chart-heading"><h2>Visitors over time</h2><span>Last 30 days</span></div><div className="chart-plot"><svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label={`Daily visitors from ${dateLabel(days[0])} to ${dateLabel(days[29])}. Peak ${highest}.`} onPointerMove={event=>{const bounds=event.currentTarget.getBoundingClientRect();setHovered(Math.max(0,Math.min(29,Math.round((event.clientX-bounds.left)/bounds.width*29))))}} onPointerLeave={()=>setHovered(null)}><defs><linearGradient id="visitor-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ae8050" stopOpacity=".35"/><stop offset="100%" stopColor="#ae8050" stopOpacity=".02"/></linearGradient></defs><path d="M 0,190 H 1000" className="chart-baseline"/><path d={fill} fill="url(#visitor-fill)"/><path d={line} className="chart-line"/>{hovered!==null&&<><path d={`M ${hovered/29*1000},18 V 190`} className="chart-guide"/><circle cx={hovered/29*1000} cy={190-counts[hovered]/highest*165} r="5" className="chart-point"/></>}</svg>{hovered!==null&&<div className="chart-tooltip" style={{left:`${Math.max(8,Math.min(92,hovered/29*100))}%`}}><strong>{counts[hovered]} {counts[hovered]===1?'visitor':'visitors'}</strong><span>{dateLabel(days[hovered])}</span></div>}</div><div className="chart-axis"><span>{dateLabel(days[0])}</span><span>{dateLabel(days[29])}</span></div><div className="chart-data"><span>Peak: {highest}</span><span>Today: {counts[29]}</span></div><div className="chart-keyboard" aria-label="Daily visitor counts">{days.map((day,index)=><button type="button" key={day.toISOString()} aria-label={`${dateLabel(day)}: ${counts[index]} visitors`} onFocus={()=>setHovered(index)} onBlur={()=>setHovered(null)}/>)}</div></section>;
}
