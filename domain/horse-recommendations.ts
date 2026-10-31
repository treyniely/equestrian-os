import {allowsRiderLevel} from './suitability.ts';
import {withinResourceAvailability,type Availability} from './availability.ts';
import {resourceWork} from './horse-planning.ts';
import {localDate} from './barn.ts';
export type HorseGuidelines={daily:number|null;weekly:number|null;rest:number};
type Resource={id:string;kind:string;name:string;details:{availability?:Availability;level?:string;suitableLevels?:string[];horseGuidelines?:HorseGuidelines;preferredHorses?:string[];[key:string]:any}};
export type HorseChoice={id:string;name:string;favorite:boolean;daily:number;weekly:number;warnings:string[];blocked:string[];recommended:boolean};
export type HorsePlanState={resources:Resource[];sessions:{id:string;status:string;start:number;end:number}[];reservations:{session:string;kind:string;resource:string}[];bookings:any[]};
export function horseChoices(state:HorsePlanState,session:{id:string;start:number;end:number},rider:Resource,taken:string[]=[]):HorseChoice[]{
 const business=state.resources.find(r=>r.kind==='academy')?.details.availability as Availability|undefined,zone=business?.timezone??'UTC',day=localDate(session.start,zone),date=new Date(day+'T12:00:00Z'),weekday=(date.getUTCDay()+6)%7;date.setUTCDate(date.getUTCDate()-weekday);const first=date.toISOString().slice(0,10);date.setUTCDate(date.getUTCDate()+7);const next=date.toISOString().slice(0,10);
 const other={...state,reservations:state.reservations.filter(r=>r.session!==session.id)};
 const choices=state.resources.filter(r=>r.kind==='horse').map(h=>{const work=resourceWork(other,'horse',h.id),daily=work.filter(w=>localDate(w.start,zone)===day).length,weekly=work.filter(w=>{const d=localDate(w.start,zone);return d>=first&&d<next}).length,blocked:string[]=[],warnings:string[]=[],guidelines=h.details.horseGuidelines;
 if(!allowsRiderLevel('horse',h.details,rider.details.level??'Beginner'))blocked.push('Not suitable for this rider’s level');
 if(!withinResourceAvailability('horse',session.start,session.end,business))blocked.push('Outside academy hours');
 if(work.some(w=>session.start<w.end&&w.start<session.end))blocked.push('Already booked at this time');
 if(taken.includes(h.id))blocked.push('Assigned to another rider in this session');
 if(guidelines?.daily&&daily+1>guidelines.daily)warnings.push('Above '+guidelines.daily+' lessons/day target');
 if(guidelines?.weekly&&weekly+1>guidelines.weekly)warnings.push('Above '+guidelines.weekly+' lessons/week target');
 if(guidelines?.rest&&work.some(w=>session.start<w.end+guidelines.rest*60000&&w.start<session.end+guidelines.rest*60000))warnings.push('Less than '+guidelines.rest+' minutes between lessons');
 return {id:h.id,name:h.name,favorite:!!rider.details.preferredHorses?.includes(h.id),daily,weekly,blocked,warnings,recommended:false};
 });
 choices.sort((a,b)=>Number(!!a.blocked.length)-Number(!!b.blocked.length)||Number(!!a.warnings.length)-Number(!!b.warnings.length)||Number(b.favorite)-Number(a.favorite)||a.daily-b.daily||a.weekly-b.weekly||a.name.localeCompare(b.name));
 const recommended=choices.find(h=>!h.blocked.length&&!h.warnings.length);if(recommended)recommended.recommended=true;return choices;
}
