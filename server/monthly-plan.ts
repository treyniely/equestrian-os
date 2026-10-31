import {z} from 'zod';
import {isCalendarDate} from '../domain/availability.ts';
import {previewMonthlyPlan,selectedPlanSlots} from '../domain/monthly-plan.ts';
import {auditEntry} from './workspace.ts';
const id=z.string().min(1).max(100),ids=z.array(id).max(100).refine(v=>new Set(v).size===v.length,'Choose each item once.');
export const monthPlanSchema=z.object({mode:z.enum(['trainer','academy']).optional(),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).refine(v=>isCalendarDate(v+'-01')),trainer:z.string().max(100).default(''),excludedDates:z.array(z.string().refine(isCalendarDate)).max(31),blocks:z.array(z.object({endTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),trainer:z.string().max(100).optional(),count:z.number().int().min(1).max(8).default(1),gap:z.number().int().min(0).max(120).default(0),id,program:id,days:z.array(z.number().int().min(0).max(6)).min(1).max(7),weeks:z.array(z.number().int().min(1).max(5)).min(1).max(5),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),arena:id,horses:ids,trainers:ids,interns:ids}).refine(b=>!b.endTime||b.endTime>b.time,'The end time must be after the start.')).min(1).max(20).refine(v=>new Set(v.map(b=>b.id)).size===v.length,'Each block needs a unique ID.')});
export async function monthlyPreview(db:D1Database,tenant:string,raw:unknown){
 const plan=monthPlanSchema.parse(raw),first=Date.parse(plan.month+'-01T00:00:00Z'),next=new Date(first);next.setUTCMonth(next.getUTCMonth()+1);const begin=first-2*86400000,end=next.getTime()+2*86400000;
 const [resources,sessions,reservations,bookings,attendance]=await Promise.all([
 db.prepare("SELECT id,kind,name,details FROM resources WHERE tenant=? AND kind IN ('academy','trainer','intern','horse','arena','lesson','level')").bind(tenant).all<any>(),
 db.prepare("SELECT id,program,start,end,status FROM sessions WHERE tenant=? AND status='scheduled' AND start<? AND end>?").bind(tenant,end,begin).all<any>(),
 db.prepare("SELECT v.kind,v.resource,v.session FROM reservations v JOIN sessions s ON s.tenant=v.tenant AND s.id=v.session WHERE v.tenant=? AND s.status='scheduled' AND s.start<? AND s.end>?").bind(tenant,end,begin).all<any>(),
 db.prepare("SELECT trainer,horse,arena,start,end,status FROM bookings WHERE tenant=? AND status<>'canceled' AND start<? AND end>?").bind(tenant,end,begin).all<any>(),
 db.prepare('SELECT intern,date,status FROM intern_attendance WHERE tenant=? AND date>=? AND date<?').bind(tenant,plan.month+'-01',next.toISOString().slice(0,10)).all<any>()]);
 return previewMonthlyPlan({resources:resources.results.map(r=>({...r,details:JSON.parse(r.details)})),sessions:sessions.results,reservations:reservations.results,bookings:bookings.results,intern_attendance:attendance.results},plan);
}
async function fingerprint(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(v=>v.toString(16).padStart(2,'0')).join('')}
export async function saveMonthlyPlan(db:D1Database,tenant:string,raw:Record<string,unknown>,origin=''){
 const announcement=z.object({subject:z.string().trim().min(1).max(100),message:z.string().trim().min(1).max(1600)}).optional().parse(raw.announcement);
 const expectedSlots=z.array(z.object({key:id,start:z.number().nullable(),end:z.number().nullable(),capacity:z.number().int()})).max(100).optional().parse(raw.expectedSlots);
 const plan=monthPlanSchema.parse(raw.plan),requestKey=id.parse(raw.requestKey),excluded=ids.parse(raw.excludedKeys??[]),hash=await fingerprint({plan,excluded:[...excluded].sort(),...(announcement?{announcement}:{}),...(expectedSlots?{expectedSlots}:{})});
 const prior=()=>db.prepare('SELECT fingerprint FROM schedule_batches WHERE tenant=? AND request_key=?').bind(tenant,requestKey).first<{fingerprint:string}>();
 const existing=await prior();if(existing){if(existing.fingerprint!==hash)throw Error('This save key already belongs to a different plan. Reopen the planner.');return;}
 const preview=await monthlyPreview(db,tenant,plan);if(expectedSlots&&JSON.stringify(preview.slots.map(s=>({key:s.key,start:s.start,end:s.end,capacity:s.capacity})))!==JSON.stringify(expectedSlots))throw Error('Availability changed. Go Back and review the month again before publishing.');const slots=selectedPlanSlots(preview.slots,excluded);if(!slots.length)throw Error('Choose at least one session to schedule.');
 if(excluded.some(key=>!preview.slots.some(s=>s.key===key)))throw Error('The plan changed. Preview it again.');
 const conflict=slots.find(s=>s.issues.length);if(conflict)throw Error(conflict.date+' · '+conflict.name+': '+conflict.issues[0]);
 const writes:D1PreparedStatement[]=[db.prepare('INSERT INTO schedule_batches(tenant,request_key,fingerprint,created) VALUES(?,?,?,?)').bind(tenant,requestKey,hash,Date.now())];
 for(const s of slots){const session=crypto.randomUUID();writes.push(db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?,?)').bind(session,tenant,s.program,s.start,s.end,s.capacity,'scheduled',requestKey+':'+s.key),...s.pairs.map(([kind,resource])=>db.prepare('INSERT INTO reservations VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),tenant,session,resource,kind)));}
 if(writes.length>800)throw Error('This plan reserves too many resources at once. Save a smaller set of sessions.');
 if(announcement){
 const customers=(await db.prepare('SELECT id,email,email_consent,adult_confirmed FROM customers WHERE tenant=?').bind(tenant).all<{id:string;email:string;email_consent:number;adult_confirmed:number}>()).results;
 const excludedIds=customers.filter(c=>!c.adult_confirmed||!c.email_consent||!c.email).map(c=>c.id),eligibleCount=customers.length-excludedIds.length;
 const link=origin?new URL('/portal?academy='+encodeURIComponent(tenant),origin).href:'';
 const audience=JSON.stringify({filters:{segment:'All customers',query:'',level:'',riderGroup:'',customerGroup:'',optin:''},excludedIds,eligibleCount,reviewedAt:Date.now(),source:'monthly-launch',month:plan.month});
 writes.push(db.prepare('INSERT INTO drafts(id,tenant,kind,name,segment,channel,message,delay,created,audience) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,'message',announcement.subject,'All customers','email',announcement.message+(link?'\n\nBook now: '+link:''),0,Date.now(),audience));
 }
 writes.push(auditEntry(db,tenant,'Scheduled monthly plan: '+preview.trainer+' · '+plan.month+' · '+slots.length+' sessions'));
 try{await db.batch(writes)}catch(error){const retry=await prior();if(retry?.fingerprint===hash)return;throw error;}
}
