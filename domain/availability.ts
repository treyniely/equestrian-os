export const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export type DayHours={enabled:boolean;start:string;end:string;breaks?:{start:string;end:string}[]};
export type Availability={timezone:string;days:DayHours[];datesOff?:string[];dateOverrides?:(DayHours&{date:string})[]};
export function isTimeZone(value:string){try{new Intl.DateTimeFormat('en',{timeZone:value}).format(0);return true}catch{return false}}
export function isCalendarDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value}
/** A date override replaces that weekday, including its breaks. Legacy closures stay supported. */
export function hoursForDate(availability:Availability|undefined,date:string):DayHours{
 const override=availability?.dateOverrides?.find(d=>d.date===date);
 if(override)return override;
 const regular=availability?.days[new Date(date+'T12:00:00Z').getUTCDay()]??{enabled:true,start:'08:00',end:'18:00'};
 return availability?.datesOff?.includes(date)?{...regular,enabled:false}:regular;
}
export function dateHoursChanges(availability?:Availability){
 const changes=new Map<string,DayHours&{date:string}>();
 for(const date of availability?.datesOff??[])changes.set(date,{date,enabled:false,start:'08:00',end:'18:00'});
 for(const change of availability?.dateOverrides??[])changes.set(change.date,change);
 return [...changes.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function withinAvailability(start:number,end:number,availability?:Availability){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return false;
 const zone=availability?.timezone??'UTC';
 const parts=(time:number)=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'long',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(time).map(x=>[x.type,x.value]));return {day:weekdays.indexOf(p.weekday),date:p.year+'-'+p.month+'-'+p.day,minutes:Number(p.hour)*60+Number(p.minute)}};
 const a=parts(start),b=parts(end);const day=hoursForDate(availability,a.date);const mins=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3));
 return day.enabled&&a.date===b.date&&a.minutes>=mins(day.start)&&b.minutes<=mins(day.end)&&!(day.breaks??[]).some(p=>a.minutes<mins(p.end)&&mins(p.start)<b.minutes);
}

/** Business hours/closures always win; unconfigured profiles follow business hours. */
export function withinBookingAvailability(start:number,end:number,business?:Availability,profile?:Availability){return business?withinAvailability(start,end,business)&&(!profile||withinAvailability(start,end,profile)):withinAvailability(start,end,profile)}

/** Horses follow academy hours and existing reservations, never a personal weekly schedule. */
export function withinResourceAvailability(kind:string,start:number,end:number,business?:Availability,profile?:Availability){return withinBookingAvailability(start,end,business,kind==='horse'?undefined:profile)}
