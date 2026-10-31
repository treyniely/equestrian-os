import {withinResourceAvailability,type Availability} from './availability.ts';import {localDate,taskTime} from './barn.ts';
type WindowResource={kind:string;availability?:Availability;work:{start:number;end:number}[]};
type WindowInput={date:string;from:string;until:string;zone:string;business?:Availability;resources:WindowResource[]};
function windowContext(input:WindowInput){
 const {date,from,until,zone,business,resources}=input,start=taskTime(date,from,zone),finish=taskTime(date,until,zone),points=new Set<number>([start,finish]);
 const schedules:Availability[]=[...(business?[business]:[]),...resources.flatMap(r=>r.kind==='horse'?[]:r.availability?[r.availability]:business?[]:[{timezone:'UTC',days:Array.from({length:7},()=>({enabled:true,start:'08:00',end:'18:00'}))}])];
 if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<=start)return {start,finish,boundaries:[],free:()=>false};
 for(const schedule of schedules){const base=localDate(start,schedule.timezone);for(const offset of [-1,0,1]){const day=new Date(base+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+offset);const local=day.toISOString().slice(0,10),hours=schedule.days[day.getUTCDay()];if(!hours?.enabled)continue;for(const time of [hours.start,hours.end,...(hours.breaks??[]).flatMap(b=>[b.start,b.end])]){const value=taskTime(local,time,schedule.timezone);if(value>start&&value<finish)points.add(value)}}}
 for(const r of resources)for(const work of r.work)for(const value of [work.start,work.end])if(value>start&&value<finish)points.add(value);
 return {start,finish,boundaries:[...points].sort((a,b)=>a-b),free:(a:number,b:number)=>resources.every(r=>withinResourceAvailability(r.kind,a,b,business,r.availability)&&!r.work.some(w=>a<w.end&&w.start<b))};
}
/** Actual free intervals, including profile hours, lunch, time off and existing work. */
export function availableTeachingWindows(input:WindowInput){const {boundaries,free}=windowContext(input),result:{start:number;end:number}[]=[];for(let i=0;i<boundaries.length-1;i++){const start=boundaries[i],end=boundaries[i+1];if(!free(start,end))continue;const last=result.at(-1);if(last?.end===start)last.end=end;else result.push({start,end})}return result;}
/** Fill a local teaching window, resuming at actual break/booking boundaries. */
export function lessonWindowStarts(input:WindowInput&{duration:number;gap:number}){
 const {duration,gap}=input,{start,finish,boundaries,free}=windowContext(input),length=duration*60000,spacing=gap*60000;
 if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<=start||duration<=0||gap<0)return [];
 const result:number[]=[];let cursor=start;
 while(cursor+length<=finish){const end=cursor+length;if(free(cursor,end)){result.push(cursor);cursor=end+spacing}else{const next=boundaries.find(t=>t>cursor);if(next===undefined)break;cursor=next}if(result.length>200)break;}
 return result;
}
