import {z} from 'zod';import {isCalendarDate} from './availability.ts';
const id=z.string().min(1).max(100);
export const planSchema=z.object({id:z.string().max(100).optional(),name:z.string().trim().min(1).max(100),description:z.string().trim().max(800).default(''),kind:z.enum(['monthly','pack']),price:z.number().int().min(0).max(10000000),validDays:z.number().int().min(1).max(365).default(90),scope:z.enum(['rider','family']).default('rider'),buckets:z.array(z.object({label:z.string().trim().min(1).max(80),quantity:z.number().int().min(1).max(100),programs:z.array(id).min(1).max(30),limits:z.array(z.object({program:id,maximum:z.number().int().min(1).max(100)})).max(30).optional()}).refine(b=>!b.limits||(new Set(b.limits.map(l=>l.program)).size===b.limits.length&&b.limits.every(l=>b.programs.includes(l.program)&&l.maximum<=b.quantity)),'Each limit must match an included offering and fit within the allowance.')).min(1).max(12)}).refine(p=>{const all=p.buckets.flatMap(b=>b.programs);return new Set(all).size===all.length},'Each offering can belong to only one allowance in a plan.');
export type PlanDefinition=z.infer<typeof planSchema>;
export type Benefit={bucket:string;period:string;customer:string;rider:string|null;membership:string;plan_id:string;name:string;kind:string;price:number;currency:string;start:number;end:number;start_date:string;end_date:string;anchor:number;status:string;label:string;quantity:number;used:number;programs:string[];limits?:{program:string;maximum:number;used:number}[]};
export function periodEnd(date:string,kind:string,validDays=90,anchor=Number(date.slice(8))){if(!isCalendarDate(date))throw Error('Choose a valid period start date.');const d=new Date(date+'T12:00:00Z');if(kind==='monthly'){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(anchor,last))}else d.setUTCDate(d.getUTCDate()+validDays);return d.toISOString().slice(0,10)}
export type ReleasedCredit = {bucket:string;program:string};

export function benefitLimitReached(benefit:Benefit, program:string, release?:ReleasedCredit){
 const limit=benefit.limits?.find(item=>item.program===program);
 return !!limit && limit.used-Number(release?.bucket===benefit.bucket&&release.program===program)>=limit.maximum;
}

export function matchingBenefit(benefits:Benefit[],rider:string,program:string,start:number,release?:ReleasedCredit){
 return benefits.filter(b=>b.status==='active'&&(!b.rider||b.rider===rider)&&b.programs.includes(program)&&start>=b.start&&start<b.end&&b.used-Number(b.bucket===release?.bucket)<b.quantity&&!benefitLimitReached(b,program,release)).sort((a,b)=>a.end-b.end||a.bucket.localeCompare(b.bucket))[0];
}
