import {lessonWindowStarts} from './lesson-window.ts';
import {isCalendarDate,isTimeZone,withinResourceAvailability,weekdays} from './availability.ts';
import {taskTime,localDate} from './barn.ts';
import {resourceWork} from './horse-planning.ts';
import {allowsRiderLevel} from './suitability.ts';
export type DateWindows={date:string;windows:{from:string;until:string}[]};
export type PlanBlock={dateWindows?:DateWindows[];endTime?:string;trainer?:string;count?:number;gap?:number;id:string;program:string;days:number[];time:string;weeks:number[];arena:string;horses:string[];trainers:string[];interns:string[]};
export type MonthPlan={mode?:'trainer'|'academy';month:string;trainer:string;blocks:PlanBlock[];excludedDates:string[]};
type Resource={id:string;kind:string;name:string;details:Record<string,any>};
type PlannerState={resources:Resource[];reservations:{kind:string;resource:string;session:string}[];sessions:{id:string;status:string;start:number;end:number;program?:string}[];bookings:any[];intern_attendance?:{intern:string;date:string;status:string}[]};
export type PlanSlot={key:string;block:string;date:string;program:string;name:string;start:number;end:number;capacity:number;pairs:[string,string][];issues:string[];overlaps:{key:string;name:string;resources:string}[]};
export function previewMonthlyPlan(state:PlannerState,plan:MonthPlan){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(plan.month)||!isCalendarDate(plan.month+'-01'))throw Error('Choose a valid month.');
 const academy=state.resources.find(r=>r.kind==='academy'),business=academy?.details.availability,zone=business?.timezone??'UTC';if(!isTimeZone(zone))throw Error('Choose a valid academy time zone.');
 const lead=state.resources.find(r=>r.id===plan.trainer&&r.kind==='trainer');if(plan.mode!=='academy'&&!lead)throw Error('Choose a trainer in this academy.');
 const workCache=new Map<string,ReturnType<typeof resourceWork>>();const work=(kind:string,id:string)=>{const key=kind+':'+id;if(!workCache.has(key))workCache.set(key,resourceWork(state,kind,id));return workCache.get(key)!};
 const slots:PlanSlot[]=[],last=new Date(Date.parse(plan.month+'-01T12:00:00Z'));last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
 for(const block of plan.blocks){if(block.dateWindows?.some(d=>!isCalendarDate(d.date)||!d.date.startsWith(plan.month)))throw Error('Day schedules must be inside the selected month.');const program=state.resources.find(r=>r.kind==='lesson'&&r.id===block.program);if(!program)throw Error('Choose an offering in this academy.');
 const primary=plan.mode==='academy'?state.resources.find(r=>r.id===block.trainer&&r.kind==='trainer'):lead;if(!primary)throw Error('Choose a trainer for each lesson block.');
 const pairs:[string,string][]=[['trainer',primary.id],...block.trainers.filter(id=>id!==primary.id).map(id=>['trainer',id] as [string,string]),...block.interns.map(id=>['intern',id] as [string,string]),['arena',block.arena],...block.horses.map(id=>['horse',id] as [string,string])];
 if(new Set(pairs.map(p=>p[1])).size!==pairs.length)throw Error('Choose each team member or resource once per block.');
 for(let day=1;day<=last.getUTCDate();day++){const date=plan.month+'-'+String(day).padStart(2,'0'),weekday=new Date(date+'T12:00:00Z').getUTCDay(),week=Math.floor((day-1)/7)+1;if(plan.excludedDates.includes(date))continue;const explicit=block.dateWindows?.find(d=>d.date===date);if(block.dateWindows?!explicit?.windows.length:!block.days.includes(weekday)||!block.weeks.includes(week))continue;
 const periods:{from:string;until?:string}[]=[];for(const window of [...(explicit?.windows??[{from:block.time,until:block.endTime}])].sort((a,b)=>a.from.localeCompare(b.from))){const last=periods.at(-1);if(last?.until===window.from)last.until=window.until;else periods.push({...window})}
 for(const selectedWindow of periods){const from=selectedWindow.from,until=selectedWindow.until;
 const windowStarts=until?lessonWindowStarts({date,from,until,zone,duration:program.details.duration??45,gap:block.gap??0,business,resources:pairs.flatMap(([kind,id])=>{const r=state.resources.find(r=>r.id===id&&r.kind===kind);return r?[{kind,availability:r.details.availability,work:kind==='trainer'&&id===primary.id?[...work(kind,id),...slots.filter(s=>s.block===block.id&&s.date===date).map(s=>({start:s.start,end:s.end+(block.gap??0)*60000}))]:work(kind,id)}]:[]})}):null;
 for(let repeat=0;repeat<(windowStarts?.length??block.count??1);repeat++){const minutes=Number(from.slice(0,2))*60+Number(from.slice(3))+repeat*((program.details.duration??45)+(block.gap??0)),time=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
 const start=windowStarts?windowStarts[repeat]:minutes>=1440?NaN:taskTime(date,time,zone),end=start+(program.details.duration??45)*60000,issues:string[]=[];
 if(Number.isFinite(start)&&start<Date.now())issues.push('This start time has already passed.');
 if(!Number.isFinite(start))issues.push(minutes>=1440?'This block extends past midnight. Use fewer lessons or an earlier start.':'This local time does not exist because the clocks change.');
 const level=state.resources.find(r=>r.kind==='level'&&r.id===program.details.level)?.name;
 for(const [kind,id] of pairs){const resource=state.resources.find(r=>r.id===id&&r.kind===kind);if(!resource){issues.push('Choose a valid '+kind+' in this academy.');continue;}
 if(!withinResourceAvailability(kind,start,end,business,resource.details.availability))issues.push(resource.name+' is outside available hours or has a day off.');
 if(level&&['horse','trainer'].includes(kind)&&!allowsRiderLevel(kind,resource.details,level))issues.push(resource.name+' is not suitable for '+level+'.');
 if(work(kind,id).some(w=>start<w.end&&w.start<end))issues.push(resource.name+' is already booked.');
 if(kind==='intern'&&state.intern_attendance?.some(a=>a.intern===id&&a.date===date&&a.status==='absent'))issues.push(resource.name+' is marked not here today.');
 }
 if(slots.length>=200)throw Error('This plan creates more than 200 sessions. Use fewer days or blocks.');
 slots.push({key:block.id+':'+date+(windowStarts?':'+start:repeat?':'+repeat:''),block:block.id,date,program:program.id,name:program.name,start,end,capacity:program.details.capacity??1,pairs,issues,overlaps:[]});
 }}}}
 if(slots.length>200)throw Error('This plan creates more than 200 sessions. Use fewer days or blocks, then plan the remaining sessions separately.');
 slots.sort((a,b)=>a.start-b.start||a.key.localeCompare(b.key));
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){const a=slots[i],b=slots[j];if(a.start<b.end&&b.start<a.end){const shared=a.pairs.filter(p=>b.pairs.some(q=>q[1]===p[1]));if(shared.length){const names=shared.map(p=>state.resources.find(r=>r.id===p[1])?.name??p[0]).join(', ');a.overlaps.push({key:b.key,name:b.name,resources:names});b.overlaps.push({key:a.key,name:a.name,resources:names});}}}
 return {timezone:zone,trainer:plan.mode==='academy'?'Academy team':lead!.name,slots};
}
export {weekdays,localDate};

export function selectedPlanSlots(slots:PlanSlot[],excluded:string[]){const selected=slots.filter(s=>!excluded.includes(s.key)),keys=new Set(selected.map(s=>s.key));return selected.map(s=>({...s,issues:[...s.issues,...s.overlaps.filter(o=>keys.has(o.key)).map(o=>'Overlaps '+o.name+' in this plan: '+o.resources+'.')]}))}
