import {z} from 'zod';
import type {ScheduleUndoReceipt} from '../domain/schedule-undo.ts';
// The UI offers five seconds; a short server grace window allows an in-flight Undo to arrive.
const windowMs=15000;
export function scheduleUndoWrite(db:D1Database,tenant:string,sessions:string[],requestKey:string,draft:string|null=null){const token=crypto.randomUUID();return {receipt:{token,count:sessions.length} as ScheduleUndoReceipt,write:db.prepare('INSERT INTO schedule_undo(token,tenant,sessions,draft,request_key,created) VALUES(?,?,?,?,?,?)').bind(token,tenant,JSON.stringify(sessions),draft,requestKey,Date.now())};}
export async function undoSchedule(db:D1Database,tenant:string,raw:unknown){const token=z.string().uuid().parse(raw),row=await db.prepare('SELECT created,undone FROM schedule_undo WHERE tenant=? AND token=?').bind(tenant,token).first<{created:number;undone:number}>();if(!row)throw Error('This scheduling action is not available to undo.');if(row.undone)return;if(Date.now()-row.created>windowMs)throw Error('The undo window has ended. Manage this lesson from the calendar.');
 // The receipt trigger validates the entire action inside the same transaction as removal.
 // A booking racing this transaction either blocks Undo or sees no session to book.
 const scope="SELECT value FROM json_each((SELECT sessions FROM schedule_undo WHERE tenant=? AND token=? AND undone=1))";
 await db.batch([db.prepare('UPDATE schedule_undo SET undone=1 WHERE tenant=? AND token=? AND undone=0').bind(tenant,token),...['rider_horses','session_horse_plans','reservations','barn_tasks'].map(table=>db.prepare(`DELETE FROM ${table} WHERE tenant=? AND session IN (${scope})`).bind(tenant,tenant,token)),db.prepare(`DELETE FROM sessions WHERE tenant=? AND id IN (${scope})`).bind(tenant,tenant,token),db.prepare('DELETE FROM drafts WHERE tenant=? AND id=(SELECT draft FROM schedule_undo WHERE tenant=? AND token=? AND undone=1)').bind(tenant,tenant,token),db.prepare('INSERT INTO audit VALUES(?,?,?,?)').bind(crypto.randomUUID(),tenant,'Undid newly published scheduling action',Date.now())]);
}
