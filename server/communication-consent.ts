import {z} from 'zod';
import {defaultOperationalPreferences,operationalPreferenceSchema,parseOperationalPreferences,operationalConsentEntries} from '../domain/communication-consent.ts';

type User={userId:string};
const identifier=z.string().min(1).max(100);
const snapshotId=(tenant:string,customer:string)=>'operational-consent:'+JSON.stringify([tenant,customer]);
async function family(db:D1Database,tenant:string,user:User){
    identifier.parse(tenant);
    const linked=await db.prepare(`SELECT c.id,c.adult_confirmed,c.email,c.phone FROM family_accounts f
        JOIN customers c ON c.tenant=f.tenant AND c.id=f.customer
        WHERE f.tenant=? AND f.user_id=?`).bind(tenant,user.userId).first<{id:string;adult_confirmed:number;email:string;phone:string}>();
    if(!linked)throw Error('Family account access required.');
    return linked;
}
export async function readOperationalConsent(db:D1Database,tenant:string,user:User){
    const customer=await family(db,tenant,user);
    const row=await db.prepare("SELECT details FROM resources WHERE tenant=? AND kind='communication-consent' AND id=?").bind(tenant,snapshotId(tenant,customer.id)).first<{details:string}>();
    if(!row)return {preferences:{...defaultOperationalPreferences},updatedAt:null,delivery:'not-connected' as const};
    const value=JSON.parse(row.details);
    return {preferences:parseOperationalPreferences(value.preferences),updatedAt:typeof value.updatedAt==='number'?value.updatedAt:null,delivery:'not-connected' as const};
}
export async function saveOperationalConsent(db:D1Database,tenant:string,user:User,input:unknown){
    const customer=await family(db,tenant,user);
    const preferences=operationalPreferenceSchema.parse(input);
    if(Object.values(preferences).some(Boolean)&&!customer.adult_confirmed)throw Error('An adult account holder must confirm these preferences.');
    if((preferences.lessonEmail||preferences.scheduleEmail)&&!customer.email)throw Error('Add an email address to your account before enabling email updates.');
    if((preferences.lessonSms||preferences.scheduleSms)&&!customer.phone)throw Error('Add a phone number to your account before enabling text updates.');
    const now=Date.now(),entries=operationalConsentEntries(preferences),metadata={customer:customer.id,preferences,updatedAt:now,source:'customer-portal',barn:tenant};
    await db.batch([
        db.prepare(`INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,'communication-consent','Lesson and schedule preferences',?)
            ON CONFLICT(id) DO UPDATE SET details=excluded.details WHERE resources.tenant=excluded.tenant AND resources.kind='communication-consent'`)
            .bind(snapshotId(tenant,customer.id),tenant,JSON.stringify(metadata)),
        ...entries.map(entry=>db.prepare("INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,'communication-consent-event','Communication preference record',?)")
            .bind(crypto.randomUUID(),tenant,JSON.stringify({customer:customer.id,barn:tenant,source:'customer-portal',timestamp:now,...entry}))),
        db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),tenant,'Family updated lesson and schedule communication preferences',now),
    ]);
    return readOperationalConsent(db,tenant,user);
}
