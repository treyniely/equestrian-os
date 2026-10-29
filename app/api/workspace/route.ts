import { env } from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {validateBooking, type Resource,type Booking} from '../../../domain/scheduling';
const json=(v:unknown,status=200)=>Response.json(v,{status});
async function context(){const user=await getChatGPTUser();if(!user)throw new Error('AUTH');if(!env.DB)throw new Error('Database unavailable.');return {db:env.DB,tenant:user.userId};}
async function read(db:D1Database,tenant:string){const [r,b,a]=await Promise.all([db.prepare('SELECT * FROM resources WHERE tenant=? ORDER BY name').bind(tenant).all(),db.prepare('SELECT * FROM bookings WHERE tenant=? ORDER BY start').bind(tenant).all(),db.prepare('SELECT action,created FROM audit WHERE tenant=? ORDER BY created DESC LIMIT 12').bind(tenant).all()]);return {resources:r.results.map((x:any)=>({...x,details:JSON.parse(x.details)})),bookings:b.results,audit:a.results};}
export async function GET(){try{const {db,tenant}=await context();return json(await read(db,tenant));}catch(e){return json({error:e instanceof Error?e.message:'Unable to load'},e instanceof Error&&e.message==='AUTH'?401:500)}}
export async function POST(req:Request){try{
 const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)return json({error:'Invalid request origin.'},403);
 const {db,tenant}=await context();const body=await req.json() as any;
 const log=(action:string)=>db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),tenant,action,Date.now());
 if(body.action==='resource'){
 const allowed=['rider','trainer','horse','arena','lesson'];if(!allowed.includes(body.kind)||typeof body.name!=='string'||!body.name.trim()||body.name.length>100)throw new Error('Enter a valid name and resource type.');
 const details={level:['Beginner','Intermediate','Advanced'].includes(body.level)?body.level:'Beginner',duration:45,price:6500,open:8,close:18};
 await db.batch([db.prepare('INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),tenant,body.kind,body.name.trim(),JSON.stringify(details)),log('Added '+body.kind+': '+body.name.trim())]);
 }else if(body.action==='book'){
 const state=await read(db,tenant);const lesson=state.resources.find((r:any)=>r.id===body.lesson&&r.kind==='lesson');if(!lesson)throw new Error('Select a lesson type.');
 const b={id:crypto.randomUUID(),rider:body.rider,trainer:body.trainer,horse:body.horse,arena:body.arena,lesson:body.lesson,start:Number(body.start),end:Number(body.start)+lesson.details.duration*60000,status:'confirmed'};
 if(typeof body.requestKey!=='string'||body.requestKey.length>100)throw new Error('Invalid booking request.');
 const prior=await db.prepare('SELECT id FROM bookings WHERE tenant=? AND request_key=?').bind(tenant,body.requestKey).first();if(prior)return json(state);
 validateBooking(b,state.resources as Resource[],state.bookings as unknown as Booking[]);
 await db.batch([db.prepare('INSERT INTO bookings(id,tenant,rider,trainer,horse,arena,lesson,start,end,status,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(b.id,tenant,b.rider,b.trainer,b.horse,b.arena,b.lesson,b.start,b.end,b.status,body.requestKey),log('Created a lesson booking')]);
 }else if(body.action==='cancel'){
 const booking=await db.prepare('SELECT id FROM bookings WHERE tenant=? AND id=? AND status<>?').bind(tenant,body.id,'canceled').first();if(!booking)throw new Error('Booking not found.');
 await db.batch([db.prepare("UPDATE bookings SET status='canceled' WHERE tenant=? AND id=?").bind(tenant,body.id),log('Canceled a lesson booking')]);
 }else if(body.action==='demo'){
 const existing=await db.prepare('SELECT id FROM resources WHERE tenant=? LIMIT 1').bind(tenant).first();if(existing)throw new Error('Sample data can only be added to an empty workspace.');
 const sample=[['trainer','Sarah Mitchell','Beginner'],['trainer','James Wilson','Advanced'],['horse','Maple','Beginner'],['horse','Sterling','Advanced'],['arena','Indoor arena','Beginner'],['arena','Outdoor arena','Beginner'],['rider','Emma Parker','Beginner'],['rider','Olivia Reed','Advanced'],['lesson','Private · Foundations','Beginner'],['lesson','Private · Jumping','Advanced']];
 await db.batch([...sample.map(([kind,name,level])=>db.prepare('INSERT INTO resources(id,tenant,kind,name,details) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),tenant,kind,name,JSON.stringify({level,duration:45,price:6500,open:8,close:18}))),log('Loaded fictional sample academy resources')]);
 }else throw new Error('Unsupported action.');return json(await read(db,tenant));
 }catch(e){const message=e instanceof Error?e.message:'Unable to save';return json({error:message.includes('resource_conflict')?'This time was just booked. Choose another time.':message},message==='AUTH'?401:400)}}
