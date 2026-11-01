import {z} from 'zod';
import {isCalendarDate,isTimeZone} from './availability.ts';
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,'Choose a valid time.');
const dayFields={enabled:z.boolean(),start:time,end:time,breaks:z.array(z.object({start:time,end:time})).max(6).optional()};
const validHours=(d:{enabled:boolean;start:string;end:string;breaks?:{start:string;end:string}[]})=>{
 if(!d.enabled)return true;
 if(d.end<=d.start)return false;
 const pauses=[...(d.breaks??[])].sort((a,b)=>a.start.localeCompare(b.start));
 return pauses.every((p,i)=>p.end>p.start&&p.start>=d.start&&p.end<=d.end&&(i===0||pauses[i-1].end<=p.start));
};
const day=z.object(dayFields).refine(validHours,'Hours must end after they start. Breaks must fit inside those hours without overlapping.');
const date=z.string().refine(isCalendarDate,'Choose a valid date.');
export const availabilitySchema=z.object({
 timezone:z.string().refine(isTimeZone,'Choose a valid time zone.'),
 days:z.array(day).length(7),
 datesOff:z.array(date).max(366).optional().default([]),
 dateOverrides:z.array(z.object({date,...dayFields}).refine(validHours,'Date-specific hours must end after they start. Breaks must fit inside those hours without overlapping.')).max(366).refine(v=>new Set(v.map(d=>d.date)).size===v.length,'Each date can have only one hours override.').optional(),
});
