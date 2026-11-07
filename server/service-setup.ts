import {z} from 'zod';
import {can,type Grants,type Feature} from '../domain/permissions.ts';
import {billingConfigured,type BillingEnv} from './billing/stripe.ts';

export const serviceNames=['payments','messaging','video','payroll'] as const;
export type ServiceName=typeof serviceNames[number];
const serviceFeature:Record<ServiceName,Feature>={payments:'billing',messaging:'communications',video:'programs',payroll:'payroll'};
export const setupIntentSchema=z.object({
    service:z.enum(serviceNames),
    reviewed:z.boolean(),
    payrollSource:z.enum(['new','existing']).optional(),
    payFrequency:z.enum(['weekly','biweekly','semimonthly','monthly']).optional(),
    notifyFamilies:z.boolean().optional(),
}).strict().superRefine((value,ctx)=>{
    if(value.service!=='payroll'&&(value.payrollSource!==undefined||value.payFrequency!==undefined))ctx.addIssue({code:'custom',message:'Payroll choices belong to payroll setup.'});
    if(value.service!=='messaging'&&value.notifyFamilies!==undefined)ctx.addIssue({code:'custom',message:'Notification choices belong to messaging setup.'});
});
export type SetupIntent=z.infer<typeof setupIntentSchema>;
export type ServiceSetupItem={id:ServiceName;provider:string;configured:boolean;connected:boolean;live:boolean;manage:boolean;intent:SetupIntent|null;updated:number|null};
export async function readServiceSetup(db:D1Database,tenant:string,grants:Grants,runtime:BillingEnv):Promise<ServiceSetupItem[]>{
    const allowed=serviceNames.filter(name=>can(grants,serviceFeature[name]));
    if(!allowed.length)throw Error('Service setup access required.');
    const rows=await db.prepare("SELECT name,details FROM resources WHERE tenant=? AND kind='integration-setup'").bind(tenant).all<{name:string;details:string}>();
    const account=allowed.includes('payments')?await db.prepare('SELECT live FROM billing_accounts WHERE tenant=?').bind(tenant).first<{live:number}>():null;
    return allowed.map(id=>{
        const stored=rows.results.find(row=>row.name===id);
        let intent:SetupIntent|null=null,updated:number|null=null;
        try{if(stored){const parsed=JSON.parse(stored.details);const safe=setupIntentSchema.safeParse(parsed.intent);if(safe.success&&safe.data.service===id){intent=safe.data;updated=typeof parsed.updated==='number'?parsed.updated:null;}}}catch{}
        return {id,provider:({payments:'Stripe',messaging:'Twilio + SendGrid',video:'Cloudflare Stream',payroll:'Gusto Embedded'} as const)[id],configured:id==='payments'&&billingConfigured(runtime),connected:id==='payments'&&!!account,live:id==='payments'&&!!account?.live,manage:can(grants,serviceFeature[id],true),intent,updated};
    });
}
export async function saveServiceSetup(db:D1Database,tenant:string,grants:Grants,raw:unknown){
    const intent=setupIntentSchema.parse(raw);
    if(!can(grants,serviceFeature[intent.service],true))throw Error('Service setup management permission required.');
    const now=Date.now();
    await db.batch([
        db.prepare("INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,'integration-setup',?,?) ON CONFLICT(id) DO UPDATE SET details=excluded.details WHERE resources.tenant=excluded.tenant AND resources.kind='integration-setup'").bind('service:'+tenant+':'+intent.service,tenant,intent.service,JSON.stringify({intent,updated:now})),
        db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),tenant,'Reviewed '+intent.service+' setup preferences; no provider activated',now),
    ]);
}
