import { z } from 'zod';
import {allowsRiderLevel} from '../domain/suitability.ts';
import {saveFamilyContacts} from './family-contacts.ts';
import {riderIntakeSchema} from '../domain/rider-intake.ts';
import {preferredTrainers} from '../domain/preferences.ts';
import {audiencePreview} from '../domain/audiences.ts';
import {normalizeBrandColor} from '../domain/branding.ts';
import {withinAvailability,withinResourceAvailability,isTimeZone,isCalendarDate} from '../domain/availability.ts';
import {photoIdPattern} from '../domain/photos.ts';
import { templates } from '../domain/programs.ts';
export type Row = Record<string, any>;
export const nameSchema = z.string().trim().min(1).max(100);
const str = z.string().max(2000);
const id = z.string().min(1).max(100);
const optionalId = z.string().max(100).optional().default('');
export function auditEntry(db: D1Database, tenant: string, action: string) { return db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, action, Date.now()); }
export async function readWorkspace(db: D1Database, tenant: string) {
    const tables = ['resources', 'bookings', 'customers', 'memberships', 'sessions', 'reservations', 'enrollments', 'drafts', 'customer_groups', 'intern_attendance', 'barn_tasks'];
    const values = await Promise.all(tables.map(table => db.prepare(`SELECT * FROM ${table} WHERE tenant=?`).bind(tenant).all()));
    const result: Row = {};
    tables.forEach((table, i) => { result[table] = values[i].results; });
    result.customers=result.customers.map((c:Row)=>({...c,emergency_contacts:JSON.parse(c.emergency_contacts)}));
    result.resources = result.resources.map((r: Row) => ({ ...r, details: JSON.parse(r.details) }));
    result.trainer_reviews=(await db.prepare("SELECT id,trainer,rating,message,status,revision,updated FROM trainer_reviews WHERE tenant=? ORDER BY (status='pending') DESC,updated DESC LIMIT 200").bind(tenant).all()).results;
    result.audit = (await db.prepare('SELECT action,created FROM audit WHERE tenant=? ORDER BY created DESC LIMIT 30').bind(tenant).all()).results;
    return result;
}
async function resource(db: D1Database, tenant: string, value: string, kind: string): Promise<Row> { const r = await db.prepare('SELECT * FROM resources WHERE tenant=? AND id=? AND kind=?').bind(tenant, value, kind).first<Row>(); if (!r)
    throw Error('Choose a valid ' + kind + '.'); return { ...r, details: JSON.parse(r.details) }; }
export async function applyAction(db: D1Database, tenant: string, raw: Row) {
    const log = (s: string) => auditEntry(db, tenant, s), action = z.string().parse(raw.action);
    if (action === 'resource' || action === 'program') {
        const kind = action === 'program' ? 'lesson' : z.enum(['trainer', 'horse', 'arena', 'rider', 'level', 'discipline', 'group', 'customerGroup', 'intern', 'academy']).parse(raw.kind);
        const name = nameSchema.parse(raw.name);
        const resourceId=optionalId.parse(raw.id);
        const previous=resourceId?await resource(db,tenant,resourceId,kind):null;
        let details: Row = {...(previous?.details??{open:8,close:18})};
        if (kind === 'lesson') {
            const t = templates.find(t => t.id === raw.template);
            if (!t)
                throw Error('Choose a starting template.');
            details = { ...details, template: t.id, duration: z.coerce.number().int().min(15).max(720).parse(raw.duration), capacity: t.id === 'private' ? 1 : z.coerce.number().int().min(1).max(100).parse(raw.capacity), mounted: z.boolean().parse(raw.mounted), price: z.coerce.number().int().min(0).max(10000000).parse(raw.price), access: z.enum(['paid', 'free', 'membership']).parse(raw.access), level: optionalId.parse(raw.level), discipline: optionalId.parse(raw.discipline) };
            if (details.level)
                await resource(db, tenant, details.level, 'level');
            if (details.discipline)
                await resource(db, tenant, details.discipline, 'discipline');
        }
        else if (kind === 'rider' || kind === 'horse') {
            details = { ...details, level: raw.level ? nameSchema.parse(raw.level) : 'Beginner', group: optionalId.parse(raw.group), customer: optionalId.parse(raw.customer) };
            if (details.group)
                await resource(db, tenant, details.group, 'group');
            if (details.customer) {
                const c = await db.prepare('SELECT id FROM customers WHERE tenant=? AND id=?').bind(tenant, details.customer).first();
                if (!c)
                    throw Error('Customer account not found.');
            }
        }
        if(kind==='academy'&&raw.brandColor!==undefined)details.brandColor=z.string().refine(v=>normalizeBrandColor(v)!==null,'Enter a valid hex color.').transform(v=>normalizeBrandColor(v)!).parse(raw.brandColor);
        if(kind==='academy')details.cancellationHours=z.coerce.number().int().min(0).max(720).optional().default(previous?.details.cancellationHours??24).parse(raw.cancellationHours);
        if(['trainer','horse','intern','academy'].includes(kind)){
          details.description=z.string().max(3000).optional().default('').parse(raw.description);
          details.photoId=z.string().refine(v=>v===''||photoIdPattern.test(v),'Invalid photo').optional().default('').parse(raw.photoId);
        }
        if(['trainer','horse','intern','academy'].includes(kind)){delete details.dailyLimitMinutes;delete details.restMinutes;}
        if(['trainer','intern','academy'].includes(kind)){
          const hours=z.object({timezone:z.string().refine(isTimeZone),days:z.array(z.object({enabled:z.boolean(),start:z.string().regex(/^\d{2}:\d{2}$/),end:z.string().regex(/^\d{2}:\d{2}$/)})).length(7),datesOff:z.array(z.string().refine(isCalendarDate,'Choose a valid date.')).max(366).optional().default([])}).optional().parse(raw.availability);
          if(hours){for(const d of hours.days){if(d.start>'23:59'||d.end>'23:59'||Number(d.start.slice(3))>59||Number(d.end.slice(3))>59||d.enabled&&d.end<=d.start)throw Error('Availability must end after it starts.');}details.availability=hours;}
        }
        if(['trainer','horse'].includes(kind)&&raw.suitableLevels!==undefined)details.suitableLevels=Array.from(new Set(z.array(nameSchema).max(50).parse(raw.suitableLevels)));
        if(kind==='horse'){delete details.availability;if(Array.isArray(details.suitableLevels))delete details.level;}
        if(kind==='rider'){
          if(raw.photoId!==undefined)details.photoId=z.string().refine(v=>v===''||photoIdPattern.test(v),'Invalid rider photo').parse(raw.photoId);
          for(const [key,value] of Object.entries(riderIntakeSchema.parse(raw)))if(value!==undefined)details[key]=value;
          details.preferredHorses=z.array(id).max(3).optional().default([]).parse(raw.preferredHorses);
          if(new Set(details.preferredHorses).size!==details.preferredHorses.length)throw Error('Choose each favorite horse once.');
          for(const horse of details.preferredHorses)await resource(db,tenant,horse,'horse');
          details.preferredTrainers=raw.preferredTrainers!==undefined?z.array(id).max(3).parse(raw.preferredTrainers):raw.preferredTrainer!==undefined?(raw.preferredTrainer?[id.parse(raw.preferredTrainer)]:[]):preferredTrainers(previous?.details??{});if(new Set(details.preferredTrainers).size!==details.preferredTrainers.length)throw Error('Choose each preferred trainer once.');for(const trainer of details.preferredTrainers)await resource(db,tenant,trainer,'trainer');details.preferredTrainer=details.preferredTrainers[0]??'';
        }
        const recordId=resourceId||crypto.randomUUID();
        const write=resourceId?db.prepare('UPDATE resources SET name=?,details=? WHERE tenant=? AND id=?').bind(name,JSON.stringify(details),tenant,recordId):db.prepare('INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,?,?,?)').bind(recordId,tenant,kind,name,JSON.stringify(details));
        await db.batch([write,...(kind==='academy'?[db.prepare('UPDATE academies SET name=? WHERE id=?').bind(name,tenant)]:[]),log((resourceId?'Updated ':'Added ')+(kind==='lesson'?'program':kind)+': '+name)]);
        return;
    }
    if(action==='customerContacts'){await saveFamilyContacts(db,tenant,id.parse(raw.customer),raw);return;}
    if (action === 'customer') {
        const c = z.object({ id: optionalId, name: nameSchema, email: z.union([z.literal(''), z.string().email().max(200)]), phone: z.string().max(40), stage: z.enum(['inquiry', 'trial', 'active', 'inactive']), billing: z.enum(['none', 'current', 'failed', 'overdue']), balance: z.coerce.number().int().min(0).max(100000000), notes: str, emailConsent: z.boolean(), smsConsent: z.boolean(),adultConfirmed:z.boolean().optional(),groupIds:z.array(id).max(100).optional() }).parse(raw);
        if(c.groupIds)for(const group of new Set(c.groupIds))await resource(db,tenant,group,'customerGroup');
        if (c.id) {
            const exists = await db.prepare('SELECT id,adult_confirmed,email_consent,sms_consent FROM customers WHERE tenant=? AND id=?').bind(tenant, c.id).first();
            if (!exists)
                throw Error('Customer not found.');
            await db.batch([db.prepare('UPDATE customers SET name=?,email=?,phone=?,stage=?,billing=?,balance=?,notes=?,adult_confirmed=? WHERE tenant=? AND id=?').bind(c.name, c.email, c.phone, c.stage, c.billing, c.balance, c.notes,c.adultConfirmed===undefined?(exists as Row).adult_confirmed:Number(c.adultConfirmed), tenant, c.id), ...(c.groupIds?[db.prepare('DELETE FROM customer_groups WHERE tenant=? AND customer=?').bind(tenant,c.id),...Array.from(new Set(c.groupIds)).map(group=>db.prepare('INSERT INTO customer_groups VALUES(?,?,?)').bind(tenant,c.id,group))]:[]),log('Updated customer account: ' + c.name)]);
        }
        else {const customerId=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO customers(id,tenant,name,email,phone,stage,billing,balance,notes,email_consent,sms_consent,adult_confirmed) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(customerId,tenant,c.name,c.email,c.phone,c.stage,c.billing,c.balance,c.notes,Number(c.emailConsent),Number(c.smsConsent),Number(c.adultConfirmed??false)),...Array.from(new Set(c.groupIds??[])).map(group=>db.prepare('INSERT INTO customer_groups VALUES(?,?,?)').bind(tenant,customerId,group)),log('Added customer account: '+c.name)]);}
        return;
    }
    if(action==='contactPreferences'){
 const c=z.object({customer:id,unsubscribeEmail:z.boolean(),unsubscribeSms:z.boolean()}).parse(raw);if(!c.unsubscribeEmail&&!c.unsubscribeSms)throw Error('Choose at least one subscription to remove.');
 if(!await db.prepare('SELECT id FROM customers WHERE tenant=? AND id=?').bind(tenant,c.customer).first())throw Error('Customer not found.');
 await db.batch([db.prepare('UPDATE customers SET email_consent=CASE WHEN ? THEN 0 ELSE email_consent END,sms_consent=CASE WHEN ? THEN 0 ELSE sms_consent END WHERE tenant=? AND id=?').bind(Number(c.unsubscribeEmail),Number(c.unsubscribeSms),tenant,c.customer),log('Manual unsubscribe: '+c.customer+' · email '+c.unsubscribeEmail+' · SMS '+c.unsubscribeSms)]);return;
    }
    if (action === 'membership') {
        const m = z.object({ id: optionalId, customer: id, plan: nameSchema, status: z.enum(['active', 'paused', 'canceled']) }).parse(raw);
        if (!await db.prepare('SELECT id FROM customers WHERE tenant=? AND id=?').bind(tenant, m.customer).first())
            throw Error('Customer not found.');
        if (m.id) {
            if (!await db.prepare('SELECT id FROM memberships WHERE tenant=? AND id=? AND customer=?').bind(tenant, m.id, m.customer).first())
                throw Error('Membership not found.');
            await db.batch([db.prepare('UPDATE memberships SET plan=?,status=?,updated=? WHERE tenant=? AND id=?').bind(m.plan, m.status, Date.now(), tenant, m.id), log('Updated manual membership: ' + m.plan + ' → ' + m.status)]);
        }
        else
            await db.batch([db.prepare('INSERT INTO memberships VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(), tenant, m.customer, m.plan, m.status, Date.now()), log('Added manual membership: ' + m.plan)]);
        return;
    }
    if (action === 'draft') {
 const filterSchema=z.object({customerId:optionalId,segment:z.enum(['All customers','Needs attention','Active members','Trials & inquiries','Inactive']).default('All customers'),query:z.string().max(200).default(''),level:z.string().max(100).default(''),riderGroup:optionalId,customerGroup:optionalId,optin:z.enum(['','email','sms','both','neither']).default('')});
 const d=z.object({kind:z.enum(['message','automation']),name:nameSchema,segment:z.enum(['All customers','Needs attention','Active members','Trials & inquiries','Inactive']),channel:z.enum(['email','sms']),message:z.string().trim().min(1).max(2000),delay:z.coerce.number().int().min(0).max(720),filters:filterSchema.optional(),excludedIds:z.array(id).max(5000).default([])}).parse(raw);
 const filters=d.filters??filterSchema.parse({segment:d.segment});for(const [value,kind] of [[filters.riderGroup,'group'],[filters.customerGroup,'customerGroup']])if(value)await resource(db,tenant,value,kind);
 const s=await readWorkspace(db,tenant);const preview=audiencePreview({...s,customerGroups:s.customer_groups} as any,filters,d.channel,d.excludedIds);
 if(preview.blocked.length)throw Error('Remove '+preview.blocked.length+' flagged contact(s) without confirmed adult status, channel consent or contact details before saving.');
 if(!preview.eligible.length)throw Error('Choose at least one eligible adult contact.');
 const audience=JSON.stringify({filters,excludedIds:d.excludedIds,eligibleCount:preview.eligible.length,reviewedAt:Date.now()});
 await db.batch([db.prepare('INSERT INTO drafts(id,tenant,kind,name,segment,channel,message,delay,created,audience) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,d.kind,d.name,filters.segment,d.channel,d.message,d.delay,Date.now(),audience),log('Saved consent-checked '+d.kind+' draft: '+d.name)]);return;
    }
    if (action === 'session') {
        const b = z.object({ program: id, start: z.number().int().positive(), trainer: id, arena: id, horses: z.array(id).max(100), requestKey: id }).parse(raw);
        const existing = await db.prepare('SELECT id FROM sessions WHERE tenant=? AND request_key=?').bind(tenant, b.requestKey).first();
        if (existing)
            return;
        const program = await resource(db, tenant, b.program, 'lesson');
        const details = program.details;
        const duration = details.duration ?? 45, capacity = details.capacity ?? 1;
        const start = new Date(b.start), end = new Date(b.start + duration * 60000);
        const pairs = [['trainer', b.trainer], ['arena', b.arena], ...Array.from(new Set(b.horses)).map(h => ['horse', h])];
        const academy=await db.prepare("SELECT details FROM resources WHERE tenant=? AND kind='academy' LIMIT 1").bind(tenant).first<Row>();const business=academy?JSON.parse(academy.details).availability:undefined;if(business&&!withinAvailability(b.start,end.getTime(),business))throw Error('The academy is closed at this time.');
        for (const [kind, value] of pairs){const r=await resource(db, tenant, value, kind);if(!withinResourceAvailability(kind,b.start,end.getTime(),business,r.details.availability))throw Error(r.name+' is not available at this time.');if(['trainer','horse'].includes(kind)&&program.details.level){const level=await resource(db,tenant,program.details.level,'level');if(!allowsRiderLevel(kind,r.details,level.name))throw Error('This '+kind+' is not suitable for the selected program level.');}}
        if ((details.mounted ?? true) && new Set(b.horses).size < capacity)throw Error('Assign one horse for each mounted spot, or lower the program capacity.');
        const sessionId = crypto.randomUUID();
        await db.batch([db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?,?,?,?)').bind(sessionId, tenant, b.program, b.start, end.getTime(), capacity, 'scheduled', b.requestKey), ...pairs.map(([kind, value]) => db.prepare('INSERT INTO reservations VALUES(?,?,?,?,?)').bind(crypto.randomUUID(), tenant, sessionId, value, kind)), log('Scheduled ' + program.name)]);
        return;
    }
    if (action === 'enroll') {
        const b = z.object({ session: id, rider: id }).parse(raw);
        const session = await db.prepare("SELECT * FROM sessions WHERE tenant=? AND id=? AND status='scheduled'").bind(tenant, b.session).first<Row>();
        if (!session)
            throw Error('Session unavailable.');
        const {rider,program}=await validateEnrollment(db,tenant,session,b.rider);
        await db.batch([db.prepare('INSERT INTO enrollments VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, b.session, b.rider), log('Added ' + rider.name + ' to ' + program.name)]);
        return;
    }
    if (action === 'party') {
        const b = z.object({ session: id, customer: id }).parse(raw);
        const session = await db.prepare("SELECT * FROM sessions WHERE tenant=? AND id=? AND status='scheduled'").bind(tenant, b.session).first<Row>();
        if (!session)
            throw Error('Session unavailable.');
        await validateSessionAvailability(db,tenant,session);
        const program = await resource(db, tenant, session.program, 'lesson');
        if (program.details.template !== 'party')
            throw Error('Not a private party.');
        if (!await db.prepare('SELECT id FROM customers WHERE tenant=? AND id=?').bind(tenant, b.customer).first())
            throw Error('Select a valid organizer.');
        await db.batch([db.prepare('INSERT INTO enrollments VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, b.session, 'customer:' + b.customer), log('Reserved exclusive party for organizer')]);
        return;
    }
    if (action === 'cancelSession') {
        const session = id.parse(raw.id);
        if (!await db.prepare('SELECT id FROM sessions WHERE tenant=? AND id=?').bind(tenant, session).first())
            throw Error('Session not found.');
        await db.batch([db.prepare("UPDATE sessions SET status='canceled' WHERE tenant=? AND id=?").bind(tenant, session), log('Canceled session; resource reservations released')]);
        return;
    }
    if (action === 'removeEnrollment') {
        const enrollment = id.parse(raw.id);
        if (!await db.prepare('SELECT id FROM enrollments WHERE tenant=? AND id=?').bind(tenant, enrollment).first())
            throw Error('Registration not found.');
        await db.batch([db.prepare('DELETE FROM enrollments WHERE tenant=? AND id=?').bind(tenant, enrollment), log('Removed a session registration')]);
        return;
    }
    throw Error('Unsupported action.');
}

export async function validateEnrollment(db:D1Database,tenant:string,session:Row,riderId:string){
 await validateSessionAvailability(db,tenant,session);
        const rider = await resource(db, tenant, riderId, 'rider');
        const program = await resource(db, tenant, session.program, 'lesson');
        if (program.details.template === 'party')
            throw Error('Use the party organizer reservation for this session.');
        if (program.details.level) {
            const level = await resource(db, tenant, program.details.level, 'level');
            if (rider.details.level !== level.name)
                throw Error('This rider does not meet the program’s selected level.');
        }
        const trainerReservation=await db.prepare("SELECT resource FROM reservations WHERE tenant=? AND session=? AND kind='trainer'").bind(tenant,session.id).first<Row>();
        if(trainerReservation){const trainer=await resource(db,tenant,trainerReservation.resource,'trainer');if(!allowsRiderLevel('trainer',trainer.details,rider.details.level??'Beginner'))throw Error('This trainer does not teach this rider’s level.');}
        const horses = (await db.prepare("SELECT r.* FROM resources r JOIN reservations v ON r.id=v.resource AND r.tenant=v.tenant WHERE v.tenant=? AND v.session=? AND v.kind='horse'").bind(tenant, session.id).all<Row>()).results;
        if(horses.some(h=>!allowsRiderLevel('horse',JSON.parse(h.details),rider.details.level??'Beginner')))throw Error('A reserved horse is not suitable for this rider’s level.');

return {rider,program};
}

export async function validateSessionAvailability(db:D1Database,tenant:string,session:Row){
 const academy=await db.prepare("SELECT details FROM resources WHERE tenant=? AND kind='academy' LIMIT 1").bind(tenant).first<Row>();const business=academy?JSON.parse(academy.details).availability:undefined;if(business&&!withinAvailability(session.start,session.end,business))throw Error('The academy is closed at this time.');
        const assigned=(await db.prepare('SELECT resource,kind FROM reservations WHERE tenant=? AND session=?').bind(tenant,session.id).all<Row>()).results;for(const assignment of assigned){const r=await resource(db,tenant,assignment.resource,assignment.kind);if(!withinResourceAvailability(assignment.kind,session.start,session.end,business,r.details.availability))throw Error(r.name+' is no longer available for new registrations at this time.');}

}
