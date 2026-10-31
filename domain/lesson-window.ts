import {withinResourceAvailability,type Availability} from './availability.ts';import {localDate,taskTime} from './barn.ts';
type WindowResource={kind:string;availability?:Availability;work:{start:number;end:number}[]};
/** Fill a local teaching window, resuming at actual break/booking boundaries. */
export function lessonWindowStarts(input:{date:string;from:string;until:string;zone:string;duration:number;gap:number;business?:Availability;resources:WindowResource[]}){
 const {date,from,until,zone,duration,gap,business,resources}=input,start=taskTime(date,from,zone),finish=taskTime(date,until,zone),length=duration*60000,spacing=gap*60000;
 if(!Number.isFinite(start)||!Number.isFinite(finish)||finish<=start||duration<=0||gap<0)return [];
 const points=new Set<number>([start,finish]);const schedules:Availability[]=[...(business?[business]:[]),...resources.flatMap(r=>r.kind==='horse'?[]:r.availability?[r.availability]:business?[]:[{timezone:'UTC',days:Array.from({length:7},()=>({enabled:true,start:'08:00',end:'18:00'}))}])];
 for(const schedule of schedules){const base=localDate(start,schedule.timezone);for(const offset of [-1,0,1]){const day=new Date(base+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+offset);const local=day.toISOString().slice(0,10),hours=schedule.days[day.getUTCDay()];if(!hours?.enabled)continue;for(const time of [hours.start,hours.end,...(hours.breaks??[]).flatMap(b=>[b.start,b.end])]){const value=taskTime(local,time,schedule.timezone);if(value>start&&value<finish)points.add(value)}}}
 for(const r of resources)for(const work of r.work){if(work.end>start&&work.end<finish)points.add(work.end)}
 const boundaries=[...points].sort((a,b)=>a-b),result:number[]=[];let cursor=start;
 while(cursor+length<=finish){const end=cursor+length,free=resources.every(r=>withinResourceAvailability(r.kind,cursor,end,business,r.availability)&&!r.work.some(w=>cursor<w.end&&w.start<end));if(free){result.push(cursor);cursor=end+spacing}else{const next=boundaries.find(t=>t>cursor);if(next===undefined)break;cursor=next}if(result.length>100)break;}
 return result;
}
export function windowSessionCount(from:string,until:string,duration:number,gap=0){const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3)),available=minutes(until)-minutes(from);return duration>0&&gap>=0&&available>0?Math.floor((available+gap)/(duration+gap)):0}
