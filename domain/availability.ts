export const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export type DayHours={enabled:boolean;start:string;end:string};
export type Availability={timezone:string;days:DayHours[];datesOff?:string[]};
export function isTimeZone(value:string){try{new Intl.DateTimeFormat('en',{timeZone:value}).format(0);return true}catch{return false}}
export function isCalendarDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value}
export function withinAvailability(start:number,end:number,availability?:Availability){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return false;
 const zone=availability?.timezone??'UTC';
 const parts=(time:number)=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'long',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(time).map(x=>[x.type,x.value]));return {day:weekdays.indexOf(p.weekday),date:p.year+'-'+p.month+'-'+p.day,minutes:Number(p.hour)*60+Number(p.minute)}};
 const a=parts(start),b=parts(end);const day=availability?.days[a.day]??{enabled:true,start:'08:00',end:'18:00'};const mins=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3));
 return !availability?.datesOff?.includes(a.date)&&!availability?.datesOff?.includes(b.date)&&day.enabled&&a.date===b.date&&a.minutes>=mins(day.start)&&b.minutes<=mins(day.end);
}
