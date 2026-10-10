import Link from 'next/link';
import {cookies} from 'next/headers';
import {notFound,redirect} from 'next/navigation';
import {activityEnabled,cookieName,readActivitySession,validAdminToken,type ActivityEvent} from '@/lib/activity';
import '../activity.css';

export const dynamic='force-dynamic';
export const metadata={title:'Session · Tom Riddle’s Diary',robots:{index:false,follow:false}};

function elapsed(ms:number){const seconds=Math.max(0,Math.floor(ms/1000));return seconds<60?`${seconds}s`:`${Math.floor(seconds/60)}m ${seconds%60}s`}
function source(referrer?:string){if(!referrer)return 'Direct';try{return new URL(referrer).hostname}catch{return referrer}}
function firstValue(events:ActivityEvent[],field:'browser'|'os'|'device'|'viewport'|'language'|'referrer'){return events.find(event=>event[field])?.[field]||'—'}

export default async function SessionPage({params}:{params:Promise<{id:string}>}){
  if(!validAdminToken((await cookies()).get(cookieName)?.value))redirect('/activity');
  const {id}=await params;
  if(!/^[a-f0-9-]{36}$/.test(id))notFound();
  let events:ActivityEvent[]=[];
  let unavailable=false;
  try{if(activityEnabled)events=await readActivitySession(id);else unavailable=true}catch{unavailable=true}
  if(!events.length&&!unavailable)notFound();
  const first=events[0];
  const conversation=events.filter(event=>event.type==='input'||event.type==='output');
  const trail=events.filter(event=>event.type!=='heartbeat');
  const glance:[string,string][]=[['Started',first?new Date(first.at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'medium'}):'—'],['Browser',firstValue(events,'browser')],['Operating system',firstValue(events,'os')],['Device',firstValue(events,'device')],['Viewport',firstValue(events,'viewport')],['Language',firstValue(events,'language')],['Source',source(events.find(event=>event.referrer)?.referrer)]];
  return <main className="activity session-page"><header><div><Link className="back-link" href="/activity">← All sessions</Link><h1>Session</h1><p>{first?new Date(first.at).toLocaleString('en-GB',{dateStyle:'long',timeStyle:'short'}):id}</p></div><form action="/api/activity/logout" method="post"><button>Lock archive</button></form></header>{unavailable&&<aside role="alert">Activity storage is currently unavailable.</aside>}<div className="session-layout"><section className="conversation"><h2>Conversation</h2><p className="session-id">Session {id}</p>{conversation.map((event,index)=><article className={`message ${event.type}`} key={`${event.at}-${index}`}><div className="message-head"><b>{event.type==='input'?'Visitor wrote':'Diary replied'}</b><time>{new Date(event.at).toLocaleTimeString('en-GB')}</time></div><p>{event.text}</p><small>{event.words||0} words</small></article>)}{!conversation.length&&<p>No writing in this session.</p>}</section><aside className="session-sidebar"><section className="detail-panel"><h2>At a glance</h2><dl>{glance.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section className="detail-panel"><h2>Interaction trail</h2><ol className="trail">{trail.map((event,index)=><li key={`${event.at}-${index}`}><time>{elapsed(event.at-(first?.at||event.at))}</time><span>{event.type==='visit'?'Visit':event.type==='click'?`Click · ${event.label||'Page'}`:event.type==='input'?'Visitor wrote':'Diary replied'}</span></li>)}</ol></section></aside></div></main>
}
