import {z} from 'zod';
import {messageRecipes} from './message-recipes.ts';

export const automationIds=['bookingConfirmed','lessonReminder','bookingRescheduled','bookingCanceled','membershipStarted','renewalReminder','paymentReceipt','paymentFailed','cardExpiring','resourceShared'] as const;
export type AutomationId=typeof automationIds[number];
export type AutomationRule={id:AutomationId;prepared:boolean;channel:'email'|'sms';hours:number;subject:string;message:string};
export type CommunicationSettings={revision:number;receiptSender:'stripe'|'equestrian';rules:AutomationRule[]};
export const automationPurpose=(id:AutomationId)=>id==='resourceShared'?'promotional':'operational';
const essential=new Set<AutomationId>(['bookingConfirmed','lessonReminder','bookingRescheduled','bookingCanceled','membershipStarted','paymentFailed']);
export function defaultCommunicationSettings():CommunicationSettings{return {revision:0,receiptSender:'stripe',rules:automationIds.map(id=>({id,prepared:essential.has(id),channel:'email',hours:messageRecipes[id].hours,subject:messageRecipes[id].subject,message:messageRecipes[id].message}))};}
const rule=z.object({id:z.enum(automationIds),prepared:z.boolean(),channel:z.enum(['email','sms']),hours:z.number().int().min(0).max(720),subject:z.string().trim().min(1).max(200),message:z.string().trim().min(1).max(2000)});
export const communicationSettingsSchema=z.object({revision:z.number().int().nonnegative(),receiptSender:z.enum(['stripe','equestrian']),rules:z.array(rule).length(automationIds.length)}).superRefine((value,ctx)=>{
 if(new Set(value.rules.map(r=>r.id)).size!==automationIds.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Each automation must appear once.'});
 for(const r of value.rules){
  if(r.id==='renewalReminder'&&![24,72,168].includes(r.hours))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose 7, 3 or 1 day before renewal.'});
  if(!['lessonReminder','renewalReminder','cardExpiring'].includes(r.id)&&r.hours!==0)ctx.addIssue({code:z.ZodIssueCode.custom,message:'This automation runs when its event happens.'});
  if(r.id==='paymentReceipt'&&r.prepared&&value.receiptSender==='stripe')ctx.addIssue({code:z.ZodIssueCode.custom,message:'Choose one receipt sender.'});
 }
});
export function readCommunicationSettings(details:unknown):CommunicationSettings{const parsed=communicationSettingsSchema.safeParse(details);return parsed.success?parsed.data:defaultCommunicationSettings();}
// GSM-7 extension characters take two septets; unicode uses UTF-16 code units.
const gsmBasic=new Set([..."@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"]);
const gsmExtension=new Set([...'^{}\\[~]|€\f']);
export function smsEstimate(message:string){const unicode=[...message].some(c=>!gsmBasic.has(c)&&!gsmExtension.has(c)),units=unicode?message.length:[...message].reduce((sum,c)=>sum+(gsmExtension.has(c)?2:1),0),single=unicode?70:160,multipart=unicode?67:153;return {encoding:unicode?'Unicode':'GSM-7',units,segments:units===0?0:units<=single?1:Math.ceil(units/multipart)};}
