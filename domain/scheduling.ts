import {allowsRiderLevel} from './suitability.ts';
export type Resource = {id:string;kind:string;name:string;details:{suitableLevels?:string[];level?:string;duration?:number;price?:number;open?:number;close?:number}};
export type Booking = {id:string;rider:string;trainer:string;horse:string;arena:string;lesson:string;start:number;end:number;status:string};
export function overlaps(a:{start:number;end:number},b:{start:number;end:number}){return a.start<b.end&&b.start<a.end}
export function validateBooking(b:Booking,resources:Resource[],existing:Booking[]){
 if(!Number.isFinite(b.start)||!Number.isFinite(b.end)||b.end<=b.start)throw new Error('Choose a valid lesson time.');
 for(const kind of ['rider','trainer','horse','arena','lesson'] as const){const r=resources.find(r=>r.id===b[kind]&&r.kind===kind);if(!r)throw new Error('Choose a valid '+kind+'.');}
 const horse=resources.find(r=>r.id===b.horse)!,rider=resources.find(r=>r.id===b.rider)!;
 if(!allowsRiderLevel('horse',horse.details,rider.details.level??'Beginner'))throw new Error('This horse is not suitable for this rider’s level.');
 const trainer=resources.find(r=>r.id===b.trainer)!;if(!allowsRiderLevel('trainer',trainer.details,rider.details.level??'Beginner'))throw new Error('This trainer is not suitable for this rider’s level.');
 for(const r of resources.filter(r=>[b.trainer,b.arena].includes(r.id))){const startHour=new Date(b.start).getUTCHours()+new Date(b.start).getUTCMinutes()/60;const endHour=new Date(b.end).getUTCHours()+new Date(b.end).getUTCMinutes()/60;if(new Date(b.start).toISOString().slice(0,10)!==new Date(b.end).toISOString().slice(0,10)||startHour<(r.details.open??8)||endHour>(r.details.close??18))throw new Error(r.name+' is outside available hours (UTC).');}
 const conflict=existing.find(x=>x.status!=='canceled'&&x.id!==b.id&&overlaps(b,x)&&(['rider','trainer','horse','arena'] as const).some(k=>x[k]===b[k]));
 if(conflict)throw new Error('That time conflicts with an existing rider, trainer, horse or arena booking.');
}
