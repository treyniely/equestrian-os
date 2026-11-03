import {availabilitySchema} from './availability-schema.ts';
import {planSchema} from './plans.ts';
import {readAcademyContact} from './academy-contact.ts';
import type {Feature} from './permissions.ts';
type Resource={id:string;kind:string;name:string;details:Record<string,any>};
export type SetupStep={kind:string;title:string;description:string;target:string;feature:Feature;done:boolean};
export type SetupSummary={completedAt:number|null;steps:SetupStep[];extras:SetupStep[];ready:boolean;payments:{configured:boolean;connected:boolean;live:boolean;publishedPlans:number}};
export function setupSummary(state:{resources:Resource[];sessions:{id:string;status:string;start:number;end:number;program:string}[];reservations?:{session:string;kind:string;resource:string}[];customers:any[];team?:any[]},completedAt:number|null,payments:SetupSummary['payments'],now=Date.now()):SetupSummary{
 const resources=(kind:string)=>state.resources.filter(r=>r.kind===kind&&!r.details.archived),academy=resources('academy')[0],contact=readAcademyContact(academy?.details.contactInfo),trainers=resources('trainer'),offerings=resources('lesson'),membership=offerings.filter(r=>r.details.access==='membership');
 const validHours=(raw:unknown)=>{const parsed=availabilitySchema.safeParse(raw);return parsed.success&&parsed.data.days.some(d=>d.enabled)};
 const usablePlans=resources('plan').flatMap(p=>{const parsed=planSchema.safeParse({...p.details,name:p.name});return parsed.success&&parsed.data.buckets.every(b=>b.programs.every(id=>offerings.some(o=>o.id===id)))?[parsed.data]:[]});
 const steps:SetupStep[]=[
 {kind:'academy',title:'Name your academy',description:'The name families see throughout their portal.',target:'Academy setup',feature:'setup',done:!!academy?.name.trim()},
 {kind:'contact',title:'Add your location & contact details',description:'A street address, city and at least one way for families to contact you.',target:'Academy setup',feature:'setup',done:!!(contact.address1&&contact.city&&(contact.email||contact.phone))},
 {kind:'hours',title:'Set your hours & time zone',description:'Confirm the normal week. Add holidays and date changes whenever needed.',target:'Academy setup',feature:'setup',done:validHours(academy?.details.availability)},
 {kind:'trainer',title:'Add trainers & their availability',description:trainers.some(t=>!validHours(t.details.availability))?`${trainers.filter(t=>!validHours(t.details.availability)).length} trainer schedules need saved hours. Edit their profiles to finish.`:'Set each trainer’s teaching hours, breaks and days off.',target:'Trainers',feature:'trainers',done:trainers.length>0&&trainers.every(t=>validHours(t.details.availability))},
 {kind:'lesson',title:'Create your lessons & services',description:'Choose duration, capacity and how families pay for each offering.',target:'Lessons & Offerings',feature:'programs',done:offerings.some(o=>Number(o.details.duration)>=15&&Number(o.details.capacity)>=1&&['paid','free','membership'].includes(o.details.access))},
 ...(membership.length?[{kind:'plan',title:'Connect included lessons to plans',description:'Every plan-only offering needs a plan with a lesson allowance.',target:'Lessons & Offerings',feature:'billing' as const,done:membership.every(o=>usablePlans.some(p=>p.buckets.some(b=>b.programs.includes(o.id))))}]:[]),
 {kind:'session',title:'Publish your first available session',description:'Put an upcoming lesson or activity on the calendar for families to book.',target:'Calendar',feature:'schedule',done:state.sessions.some(s=>s.status==='scheduled'&&s.start>now&&offerings.some(o=>o.id===s.program)&&(state.reservations??[]).some(r=>r.session===s.id&&r.kind==='trainer'&&trainers.some(t=>t.id===r.resource)))}
 ];
 const extras:SetupStep[]=[
 {kind:'branding',title:'Add your logo & portal colors',description:'Make the family portal feel like your academy.',target:'Academy setup',feature:'setup',done:!!(academy?.details.photoId&&academy?.details.brandColor)},
 {kind:'payments',title:'Connect Stripe for online subscriptions',description:!payments.configured?'Platform payment setup is pending. Checkout remains off.':payments.connected?(payments.live?'Connected in live mode. Review and publish your plans.':'Connected in test mode. Live charges remain off.'):'Connect your business account, then publish rider plans.',target:'Academy setup',feature:'billing',done:payments.configured&&payments.connected&&payments.live&&payments.publishedPlans>0},
 ...(!membership.length?[{kind:'plan',title:'Build plans & packages',description:'For businesses that include lessons in a recurring plan or prepaid package.',target:'Lessons & Offerings',feature:'billing' as const,done:usablePlans.length>0}]:[]),
 {kind:'customer',title:'Bring in adult customers & their riders',description:'Add a parent or adult account first, then link each rider. Families can also sign up themselves.',target:'Customers',feature:'customers',done:state.customers.length>0&&resources('rider').some(r=>state.customers.some(c=>c.id===r.details.customer))},
 {kind:'horse',title:'Add your horses',description:'Photos, rider suitability, favorites and care records when you want them.',target:'Horses',feature:'horses',done:resources('horse').length>0},
 {kind:'arena',title:'Add riding spaces',description:'Reserve arenas and locations only if you want to plan them in EO.',target:'Riding spaces',feature:'setup',done:resources('arena').length>0},
 {kind:'levels',title:'Customize levels & rider groups',description:'Beginner, Intermediate and Advanced work out of the box. Add your own names if needed.',target:'Academy setup',feature:'setup',done:resources('level').length>0||resources('group').length>0},
 {kind:'team',title:'Invite staff & review access',description:'Give each person only the features they need. Trainer preferences have their own permission.',target:'Team & Access',feature:'team',done:(state.team??[]).some(t=>t.status==='active'||t.status==='pending')},
 {kind:'intern',title:'Set up your barn team',description:'Intern shifts, daily attendance and tasks, if you use them.',target:'Barn team',feature:'interns',done:resources('intern').length>0},
 {kind:'community',title:'Share your GroupMe',description:'Help adult family accounts discover your existing community group.',target:'Academy setup',feature:'setup',done:!!(contact.groupMeEnabled&&contact.groupMeUrl)}
 ];
 return {completedAt,steps,extras,ready:steps.every(s=>s.done),payments};
}
