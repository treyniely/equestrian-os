import { z } from 'zod';
import {withinAvailability,isTimeZone,isCalendarDate} from '../domain/availability.ts';
import {photoIdPattern} from '../domain/photos.ts';
import { templates } from '../domain/programs.ts';
export type Row = Record<string, any>;
export const nameSchema = z.string().trim().min(1).max(100);
const str = z.string().max(2000);
const id = z.string().min(1).max(100);
const optionalId = z.string().max(100).optional().default('');
export function auditEntry(db: D1Database, tenant: string, action: string) { return db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, action, Date.now()); }
export async function readWorkspace(db: D1Database, tenant: string) {
    const tables = ['resources', 'bookings', 'customers', 'memberships', 'sessions', 'reservations', 'enrollments', 'drafts'];
    const values = await Promise.all(tables.map(table => db.prepare(`SELECT * FROM ${table} WHERE tenant=?`).bind(tenant).all()));
    const result: Row = {};
    tables.forEach((table, i) => { result[table] = values[i].results; });
    result.resources = result.resources.map((r: Row) => ({ ...r, details: JSON.parse(r.details) }));
    result.audit = (await db.prepare('SELECT action,created FROM audit WHERE tenant=? ORDER BY created DESC LIMIT 30').bind(tenant).all()).results;
    return result;
}
async function resource(db: D1Database, tenant: string, value: string, kind: string): Promise<Row> { const r = await db.prepare('SELECT * FROM resources WHERE tenant=? AND id=? AND kind=?').bind(tenant, value, kind).first<Row>(); if (!r)
    throw Error('Choose a valid ' + kind + '.'); return { ...r, details: JSON.parse(r.details) }; }
export async function applyAction(db: D1Database, tenant: string, raw: Row) {
    const log = (s: string) => auditEntry(db, tenant, s), action = z.string().parse(raw.action);
    if (action === 'resource' || action === 'program') {
        const kind = action === 'program' ? 'lesson' : z.enum(['trainer', 'horse', 'arena', 'rider', 'level', 'discipline', 'group', 'academy']).parse(raw.kind);
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
        if(['trainer','horse','academy'].includes(kind)){
          details.description=z.string().max(3000).optional().default('').parse(raw.description);
          details.photoId=z.string().refine(v=>v===''||photoIdPattern.test(v),'Invalid photo').optional().default('').parse(raw.photoId);
        }
        if(['trainer','horse'].includes(kind)){
          delete details.dailyLimitMinutes;delete details.restMinutes;
          const hours=z.object({timezone:z.string().refine(isTimeZone),days:z.array(z.object({enabled:z.boolean(),start:z.string().regex(/^\d{2}:\d{2}$/),end:z.string().regex(/^\d{2}:\d{2}$/)})).length(7),datesOff:z.array(z.string().refine(isCalendarDate,'Choose a valid date.')).max(366).optional().default([])}).optional().parse(raw.availability);
          if(hours){for(const d of hours.days){if(d.start>'23:59'||d.end>'23:59'||Number(d.start.slice(3))>59||Number(d.end.slice(3))>59||d.enabled&&d.end<=d.start)throw Error('Availability must end after it starts.');}details.availability=hours;}
          if(kind==='trainer'){details.suitableLevels=z.array(nameSchema).max(50).optional().default([]).parse(raw.suitableLevels);}
        }
        if(kind==='rider'){
          details.preferredHorses=z.array(id).max(3).optional().default([]).parse(raw.preferredHorses);
          if(new Set(details.preferredHorses).size!==details.preferredHorses.length)throw Error('Choose each favorite horse once.');
          for(const horse of details.preferredHorses)await resource(db,tenant,horse,'horse');
          details.preferredTrainer=optionalId.parse(raw.preferredTrainer);if(details.preferredTrainer)await resource(db,tenant,details.preferredTrainer,'trainer');
        }
        const recordId=resourceId||crypto.randomUUID();
        const write=resourceId?db.prepare('UPDATE resources SET name=?,details=? WHERE tenant=? AND id=?').bind(name,JSON.stringify(details),tenant,recordId):db.prepare('INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,?,?,?)').bind(recordId,tenant,kind,name,JSON.stringify(details));
        await db.batch([write,...(kind==='academy'?[db.prepare('UPDATE academies SET name=? WHERE id=?').bind(name,tenant)]:[]),log((resourceId?'Updated ':'Added ')+(kind==='lesson'?'program':kind)+': '+name)]);
        return;
    }
    if (action === 'customer') {
        const c = z.object({ id: optionalId, name: nameSchema, email: z.union([z.literal(''), z.string().email().max(200)]), phone: z.string().max(40), stage: z.enum(['inquiry', 'trial', 'active', 'inactive']), billing: z.enum(['none', 'current', 'failed', 'overdue']), balance: z.coerce.number().int().min(0).max(100000000), notes: str, emailConsent: z.boolean(), smsConsent: z.boolean() }).parse(raw);
        if (c.id) {
            const exists = await db.prepare('SELECT id FROM customers WHERE tenant=? AND id=?').bind(tenant, c.id).first();
            if (!exists)
                throw Error('Customer not found.');
            await db.batch([db.prepare('UPDATE customers SET name=?,email=?,phone=?,stage=?,billing=?,balance=?,notes=?,email_consent=?,sms_consent=? WHERE tenant=? AND id=?').bind(c.name, c.email, c.phone, c.stage, c.billing, c.balance, c.notes, Number(c.emailConsent), Number(c.smsConsent), tenant, c.id), log('Updated customer account: ' + c.name)]);
        }
        else
            await db.batch([db.prepare('INSERT INTO customers VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), tenant, c.name, c.email, c.phone, c.stage, c.billing, c.balance, c.notes, Number(c.emailConsent), Number(c.smsConsent)), log('Added customer account: ' + c.name)]);
        return;
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
        const d = z.object({ kind: z.enum(['message', 'automation']), name: nameSchema, segment: z.enum(['All customers', 'Needs attention', 'Active members', 'Trials & inquiries', 'Inactive']), channel: z.enum(['email', 'sms']), message: z.string().trim().min(1).max(2000), delay: z.coerce.number().int().min(0).max(720) }).parse(raw);
        await db.batch([db.prepare('INSERT INTO drafts VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(), tenant, d.kind, d.name, d.segment, d.channel, d.message, d.delay, Date.now()), log('Saved ' + d.kind + ' draft: ' + d.name)]);
        return;
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
        for (const [kind, value] of pairs){const r=await resource(db, tenant, value, kind);if(!withinAvailability(b.start,end.getTime(),r.details.availability))throw Error(r.name+' is not available at this time.');if(kind==='trainer'&&program.details.level&&r.details.suitableLevels?.length){const level=await resource(db,tenant,program.details.level,'level');if(!r.details.suitableLevels.includes(level.name))throw Error('This instructor does not teach the selected program level.');}}
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
        const assigned=(await db.prepare('SELECT resource,kind FROM reservations WHERE tenant=? AND session=?').bind(tenant,b.session).all<Row>()).results;for(const assignment of assigned){const r=await resource(db,tenant,assignment.resource,assignment.kind);if(!withinAvailability(session.start,session.end,r.details.availability))throw Error(r.name+' is no longer available for new registrations at this time.');}
        const rider = await resource(db, tenant, b.rider, 'rider');
        const program = await resource(db, tenant, session.program, 'lesson');
        if (program.details.template === 'party')
            throw Error('Use the party organizer reservation for this session.');
        if (program.details.level) {
            const level = await resource(db, tenant, program.details.level, 'level');
            if (rider.details.level !== level.name)
                throw Error('This rider does not meet the program’s selected level.');
        }
        const trainerReservation=await db.prepare("SELECT resource FROM reservations WHERE tenant=? AND session=? AND kind='trainer'").bind(tenant,b.session).first<Row>();
        if(trainerReservation){const trainer=await resource(db,tenant,trainerReservation.resource,'trainer');if(trainer.details.suitableLevels?.length&&!trainer.details.suitableLevels.includes(rider.details.level))throw Error('This instructor does not teach this rider’s level.');}
        const horses = (await db.prepare("SELECT r.* FROM resources r JOIN reservations v ON r.id=v.resource AND r.tenant=v.tenant WHERE v.tenant=? AND v.session=? AND v.kind='horse'").bind(tenant, b.session).all<Row>()).results;
        if (rider.details.level === 'Beginner' && horses.some(h => JSON.parse(h.details).level === 'Advanced'))
            throw Error('A reserved horse is not suitable for a beginner rider.');
        await db.batch([db.prepare('INSERT INTO enrollments VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, b.session, b.rider), log('Added ' + rider.name + ' to ' + program.name)]);
        return;
    }
    if (action === 'party') {
        const b = z.object({ session: id, customer: id }).parse(raw);
        const session = await db.prepare("SELECT * FROM sessions WHERE tenant=? AND id=? AND status='scheduled'").bind(tenant, b.session).first<Row>();
        if (!session)
            throw Error('Session unavailable.');
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
