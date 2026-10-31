import {barnAction} from '../../../server/barn';
import {cookies} from 'next/headers';
import {accessFor,teamAction} from '../../../server/team';
import {moderateReview,reviewSettings} from '../../../server/trainer-reviews';
import {can,requiredFeature,visibleState} from '../../../domain/permissions';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { applyAction, readWorkspace } from '../../../server/workspace';
import { ZodError } from 'zod';
const json = (v: unknown, status = 200) => Response.json(v, { status });
async function context() { const user = await getChatGPTUser(); if (!user)
    throw new Error('AUTH'); if (!env.DB)
    throw new Error('Database unavailable.'); return {db:env.DB,user,...await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value)}; }
async function responseState(db:D1Database,tenant:string,grants:import('../../../domain/permissions').Grants,role:string){const state=await readWorkspace(db,tenant);const team=can(grants,'team')?(await db.prepare('SELECT id,name,email,role,permissions,status,expires FROM team_access WHERE tenant=?').bind(tenant).all()).results:[];const academy=state.resources.find((r:any)=>r.kind==='academy');const barn_tasks=state.barn_tasks.map((t:any)=>({...t,sessionCanceled:!!t.session&&state.sessions.some((s:any)=>s.id===t.session&&s.status==='canceled')}));return {...visibleState({...state,team,barn_tasks},grants),academyInfo:{reviewsEnabled:academy?.details.reviewsEnabled===true,name:academy?.name??'My riding academy',timezone:academy?.details.availability?.timezone??'UTC'},permissions:grants,currentRole:role};}
export async function GET() { try {
    const {db,tenant,grants,role,user}=await context();
    return json(await responseState(db,tenant,grants,role));
}
catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unable to load' }, e instanceof Error && ['AUTH','ACCESS_REVOKED'].includes(e.message) ? 401 : 500);
} }
export async function POST(req: Request) {
    try {
        const origin = req.headers.get('origin');
        if (!origin || origin !== new URL(req.url).origin)
            return json({ error: 'Invalid request origin.' }, 403);
        const {db,tenant,grants,role,user}=await context();
        const body = await req.json() as any;if(!can(grants,requiredFeature(body),true))return json({error:'You do not have permission to manage this feature.'},403);
 if(body.action==='draft'&&!can(grants,'customers'))return json({error:'Customer viewing permission is required to build an audience.'},403);
 if(body.action==='draft'&&(body.filters?.level||body.filters?.riderGroup)&&!can(grants,'riders'))return json({error:'Rider viewing permission is required for rider filters.'},403);
 if(body.action==='draft'&&['Needs attention','Active members'].includes(body.filters?.segment??body.segment)&&!can(grants,'billing'))return json({error:'Billing viewing permission is required for this segment.'},403);
 if(body.action==='customer'&&!body.id){body.emailConsent=false;body.smsConsent=false;}
 if(body.action==='demo'&&role!=='owner')return json({error:'Only the owner can load sample data.'},403);
 if(body.action==='customer'&&!can(grants,'billing',true)){const old=body.id?await db.prepare('SELECT billing,balance FROM customers WHERE tenant=? AND id=?').bind(tenant,body.id).first<any>():null;body.billing=old?.billing??'none';body.balance=old?.balance??0;}
 if(['teamInvite','teamUpdate'].includes(body.action)){const result=await teamAction(db,tenant,body,user.email,grants);return json({...await responseState(db,tenant,grants,role),...(result.inviteToken?{inviteUrl:new URL(req.url).origin+'/join#'+result.inviteToken}:{})});}

        if(body.action==='reviewSettings'){await reviewSettings(db,tenant,body);return json(await responseState(db,tenant,grants,role));}
        if(body.action==='reviewModerate'){await moderateReview(db,tenant,body);return json(await responseState(db,tenant,grants,role));}
        const log = (action: string) => db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(), tenant, action, Date.now());
        if(String(body.action).startsWith('barn'))await barnAction(db,tenant,body);
        else if (['customerStripe', 'customerContacts', 'resource', 'program', 'customer', 'contactPreferences', 'membership', 'draft', 'session', 'enroll', 'party', 'cancelSession', 'removeEnrollment'].includes(body.action)) {
            await applyAction(db, tenant, body);
        }
        else if (body.action === 'cancel') {
            const booking = await db.prepare('SELECT id FROM bookings WHERE tenant=? AND id=? AND status<>?').bind(tenant, body.id, 'canceled').first();
            if (!booking)
                throw new Error('Booking not found.');
            await db.batch([db.prepare("UPDATE bookings SET status='canceled' WHERE tenant=? AND id=?").bind(tenant, body.id), log('Canceled a lesson booking')]);
        }
        else if (body.action === 'demo') {
            const existing = await db.prepare('SELECT id FROM resources WHERE tenant=? LIMIT 1').bind(tenant).first();
            if (existing)
                throw new Error('Sample data can only be added to an empty workspace.');
            const sample = [['trainer', 'Sarah Mitchell', 'Beginner'], ['trainer', 'James Wilson', 'Advanced'], ['horse', 'Maple', 'Beginner'], ['horse', 'Sterling', 'Advanced'], ['arena', 'Indoor arena', 'Beginner'], ['arena', 'Outdoor arena', 'Beginner'], ['rider', 'Emma Parker', 'Beginner'], ['rider', 'Olivia Reed', 'Advanced'], ['lesson', 'Private · Foundations', 'Beginner'], ['lesson', 'Private · Jumping', 'Advanced']];
            await db.batch([...sample.map(([kind, name, level]) => db.prepare('INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(), tenant, kind, name, JSON.stringify({ level, duration: 45, price: 6500, open: 8, close: 18 }))), log('Loaded fictional sample academy resources')]);
        }
        else
            throw new Error('Unsupported action.');
        return json(await responseState(db,tenant,grants,role));
    }
    catch (e) {
        const message = e instanceof ZodError ? 'Please check the form fields and try again.' : e instanceof Error ? e.message : 'Unable to save';
        return json({ error: message.includes('horse_daily_limit')?'This horse would exceed its configured daily work limit. Choose another horse or time.':message.includes('horse_rest')?'This horse needs its configured rest buffer between sessions.':message.includes('resource_conflict') || message.includes('rider_conflict') ? 'A resource or rider is already booked at that time.' : message.includes('session_full') ? 'This session has no remaining spots.' : message.includes('UNIQUE') ? 'This registration or request already exists.' : message.includes('D1_') ? 'Unable to save. Refresh and try again.' : message }, ['AUTH','ACCESS_REVOKED'].includes(message)?403:400);
    }
}
