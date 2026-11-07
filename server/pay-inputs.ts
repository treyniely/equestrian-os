import {z} from 'zod';
import {isCalendarDate} from '../domain/availability.ts';
import {can,type Grants} from '../domain/permissions.ts';

const date = z.string().refine(isCalendarDate);
const id = z.string().min(1).max(100);
const period = z.object({start:date,end:date}).refine(p=>p.end>=p.start && Date.parse(p.end)-Date.parse(p.start)<=62*86400000);
const entry = z.object({
    id:id.optional(), revision:z.number().int().nonnegative().optional(),
    staff:id, day:date, minutes:z.number().int().min(0).max(1440),
    lessons:z.number().int().min(0).max(100), note:z.string().trim().min(1).max(400),
}).refine(v=>v.minutes>0||v.lessons>0);

const entryQuery = "SELECT w.id,w.staff,w.day,w.minutes,w.lessons,w.note,w.approved_by IS NOT NULL AS approved,w.revision,coalesce(b.name,t.name,'Former team member') AS name FROM work_entries w LEFT JOIN team_access t ON t.tenant=w.tenant AND t.id=w.staff LEFT JOIN barn_workers b ON b.tenant=w.tenant AND b.id=w.staff";

export async function readPayInputs(db:D1Database,tenant:string,grants:Grants,input:unknown){
    if(!can(grants,'timeApproval')&&!can(grants,'payroll'))throw Error('Time review or payroll access is required.');
    const {start,end}=period.parse(input);
    const [entries,staff,exports]=await Promise.all([
        db.prepare(entryQuery+' WHERE w.tenant=? AND w.day BETWEEN ? AND ? ORDER BY w.day,w.id').bind(tenant,start,end).all(),
        can(grants,'timeApproval',true)?db.prepare("SELECT id,name FROM team_access WHERE tenant=? AND status='active' UNION ALL SELECT id,name FROM barn_workers WHERE tenant=? AND classification IN ('employee','contractor') ORDER BY name").bind(tenant,tenant).all():{results:[]},
        db.prepare('SELECT id,start,end,created FROM pay_exports WHERE tenant=? AND start<=? AND end>=? ORDER BY start').bind(tenant,end,start).all(),
    ]);
    return {entries:entries.results,staff:staff.results,exports:exports.results};
}

export async function changePayInputs(db:D1Database,tenant:string,grants:Grants,actor:string,raw:Record<string,unknown>){
    const action=raw.action;
    if(action==='export'){
        if(!can(grants,'payroll',true))throw Error('Payroll management access is required.');
        const {start,end}=period.parse(raw);
        const existing=await db.prepare('SELECT snapshot FROM pay_exports WHERE tenant=? AND start=? AND end=?').bind(tenant,start,end).first<{snapshot:string}>();
        if(existing)return JSON.parse(existing.snapshot);
        const reviewed=z.string().min(2).max(500000).parse(raw.reviewed);
        try{
            const result=await db.prepare(`INSERT INTO pay_exports(id,tenant,start,end,snapshot,actor,created)
                SELECT ?,?,?,?,json_group_array(json_object('staff',staff,'name',name,'day',day,'minutes',minutes,'lessons',lessons)),?,?
                FROM (${entryQuery} WHERE w.tenant=? AND w.day BETWEEN ? AND ? ORDER BY w.day,w.id)
                HAVING json_group_array(json_array(id,revision))=?
                RETURNING snapshot`).bind(crypto.randomUUID(),tenant,start,end,actor,Date.now(),tenant,start,end,reviewed).first<{snapshot:string}>();
            if(result)return JSON.parse(result.snapshot);
        }catch(error){
            const prior=await db.prepare('SELECT snapshot FROM pay_exports WHERE tenant=? AND start=? AND end=?').bind(tenant,start,end).first<{snapshot:string}>();
            if(prior)return JSON.parse(prior.snapshot);
            throw error;
        }
        throw Error('Work entries changed after review. Review the period again.');
    }
    if(!can(grants,'timeApproval',true))throw Error('Time approval access is required.');
    let write:D1PreparedStatement;
    let key:string;
    if(action==='save'){
        const data=entry.parse(raw);
        key=data.id??crypto.randomUUID();
        const member=await db.prepare("SELECT id FROM team_access WHERE tenant=? AND id=? AND status='active' UNION ALL SELECT id FROM barn_workers WHERE tenant=? AND id=? AND classification IN ('employee','contractor')").bind(tenant,data.staff,tenant,data.staff).first();
        if(!member)throw Error('Choose an active team member.');
        write=data.id
            ?db.prepare('UPDATE work_entries SET staff=?,day=?,minutes=?,lessons=?,note=?,approved_by=NULL,revision=revision+1 WHERE tenant=? AND id=? AND revision=?').bind(data.staff,data.day,data.minutes,data.lessons,data.note,tenant,key,data.revision??-1)
            :db.prepare('INSERT INTO work_entries VALUES(?,?,?,?,?,?,?,NULL,0)').bind(key,tenant,data.staff,data.day,data.minutes,data.lessons,data.note);
    }else if(action==='approve'){
        const input=z.object({id,revision:z.number().int().nonnegative()}).parse(raw);
        key=input.id;
        write=db.prepare('UPDATE work_entries SET approved_by=?,revision=revision+1 WHERE tenant=? AND id=? AND revision=? AND approved_by IS NULL').bind(actor,tenant,key,input.revision);
    }else throw Error('Unknown pay input action.');
    const [,,state]=await db.batch([write,
        db.prepare(`INSERT INTO work_audit
          SELECT ?,tenant,id,?,?,json_object('staff',staff,'day',day,'minutes',minutes,'lessons',lessons,'note',note,'approvedBy',approved_by,'revision',revision)
          FROM work_entries WHERE changes()=1 AND tenant=? AND id=?`).bind(crypto.randomUUID(),actor,Date.now(),tenant,key),
        db.prepare('SELECT changes() AS saved'),
    ]);
    if(!(state.results[0] as {saved:number}|undefined)?.saved)throw Error('This work entry changed. Refresh and try again.');
    return {saved:true};
}
