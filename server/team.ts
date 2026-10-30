import {academyChoices} from './academies.ts';
import {z} from 'zod';import {features,roleGrants,normalizedGrants,type Grants} from '../domain/permissions.ts';import {auditEntry} from './workspace.ts';
export async function accessFor(db:D1Database,user:{userId:string;email:string},academy?:string){
 const choices=await academyChoices(db,user);const tenant=academy??choices[0]?.id;if(!tenant||!choices.some(c=>c.id===tenant))throw Error('ACCESS_REVOKED');
 if(tenant===user.userId||await db.prepare('SELECT id FROM academies WHERE id=? AND owner=?').bind(tenant,user.userId).first())return {tenant,grants:roleGrants('owner'),role:'owner'};
 const team=await db.prepare("SELECT * FROM team_access WHERE user_id=? AND tenant=? AND status='active'").bind(user.userId,tenant).first<any>();if(!team)throw Error('ACCESS_REVOKED');return {tenant,grants:normalizedGrants(JSON.parse(team.permissions)),role:team.role};
}
const permissionsSchema=z.object(Object.fromEntries(features.map(f=>[f,z.object({view:z.boolean(),manage:z.boolean()}).refine(v=>!v.manage||v.view)])) as unknown as Record<typeof features[number],z.ZodType<{view:boolean;manage:boolean}>>);
export async function hashToken(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function teamAction(db:D1Database,tenant:string,raw:any,actorEmail:string,actorGrants:Grants=roleGrants('owner')){const data=z.object({id:z.string().optional(),name:z.string().trim().min(1).max(100),email:z.string().email().max(200),role:z.enum(['admin','manager','instructor','intern','custom']),permissions:permissionsSchema,status:z.enum(['active','revoked','pending']).optional()}).parse(raw);if(data.email.toLowerCase()===actorEmail.toLowerCase())throw Error('Manage your own role through the academy owner.');
 for(const f of features){if(data.permissions[f].view&&!actorGrants[f]?.view||data.permissions[f].manage&&!actorGrants[f]?.manage)throw Error('You cannot grant access beyond your own permissions.');}
 const permissions=JSON.stringify(data.permissions),now=Date.now();if(raw.action==='teamUpdate'){
 const existing=await db.prepare('SELECT * FROM team_access WHERE tenant=? AND id=?').bind(tenant,data.id??'').first<any>();if(!existing)throw Error('Team member not found.');if(existing.email===actorEmail.toLowerCase())throw Error('You cannot change your own access.');const status=existing.status==='pending'&&data.status!=='revoked'?'pending':data.status??existing.status;
 if(existing.status==='pending'&&data.status==='active')throw Error('The invitation must be accepted before access can be activated.');
 await db.batch([db.prepare('UPDATE team_access SET name=?,role=?,permissions=?,status=?,updated=? WHERE tenant=? AND id=?').bind(data.name,data.role,permissions,status,now,tenant,data.id),auditEntry(db,tenant,'Updated team access for '+existing.email)]);return {};
 }
 if(await db.prepare('SELECT id FROM team_access WHERE tenant=? AND email=?').bind(tenant,data.email.toLowerCase()).first())throw Error('This person already has a team record. Manage it below.');
 const token=crypto.randomUUID()+crypto.randomUUID(),hash=await hashToken(token);await db.batch([db.prepare('INSERT INTO team_access VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),tenant,null,data.email.toLowerCase(),data.name,data.role,permissions,'pending',hash,now+7*86400000,now),auditEntry(db,tenant,'Created pending team invitation for '+data.email)]);return {inviteToken:token};
}
