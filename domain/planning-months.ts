import {localDate} from './barn.ts';
/** Next twelve full calendar months in the academy's local calendar. */
export function upcomingPlanningMonths(now:number,zone:string){const date=new Date(localDate(now,zone)+'T12:00:00Z');date.setUTCDate(1);return Array.from({length:12},()=>{date.setUTCMonth(date.getUTCMonth()+1);return {value:date.toISOString().slice(0,7),month:new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(date),year:String(date.getUTCFullYear())}})}
