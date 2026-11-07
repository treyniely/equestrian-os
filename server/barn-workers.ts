import {z} from 'zod';

const worker=z.object({
    id:z.string().uuid(),
    updated:z.number().int().nonnegative(),
    name:z.string().trim().min(1).max(100),
    email:z.union([z.literal(''),z.string().email().max(200)]),
    role:z.enum(['trainer','intern','barn-staff','manager','other']),
    classification:z.enum(['employee','contractor','unpaid','pending']),
    commitment:z.enum(['full-time','part-time','seasonal','as-needed']),
    basis:z.enum(['hourly','salary','per-lesson','fixed','unpaid','pending']),
    rate:z.number().int().min(0).max(100000000),
    onboarding:z.enum(['new','existing']),
    providerRef:z.string().trim().max(100).regex(/^[a-zA-Z0-9._-]*$/),
}).refine(w=>{
    if(w.classification==='unpaid'||w.classification==='pending')return w.basis===w.classification&&w.rate===0;
    return w.rate>0&&(w.classification==='employee'?['hourly','salary','per-lesson'].includes(w.basis):['hourly','per-lesson','fixed'].includes(w.basis));
});

export async function readBarnWorkers(db:D1Database,tenant:string){
    return (await db.prepare('SELECT id,name,email,role,classification,commitment,basis,rate,onboarding,provider_ref AS providerRef,updated FROM barn_workers WHERE tenant=? ORDER BY name,id').bind(tenant).all()).results;
}

export async function saveBarnWorker(db:D1Database,tenant:string,actor:string,input:unknown){
    const w=worker.parse(input);
    const now=Date.now();
    const values=[w.name,w.email,w.role,w.classification,w.commitment,w.basis,w.rate,w.onboarding,w.providerRef,actor];
    const saved=w.updated
        ?await db.prepare('UPDATE barn_workers SET name=?,email=?,role=?,classification=?,commitment=?,basis=?,rate=?,onboarding=?,provider_ref=?,updated_by=?,updated=max(?,updated+1) WHERE tenant=? AND id=? AND updated=? RETURNING id').bind(...values,now,tenant,w.id,w.updated).first()
        :await db.prepare('INSERT OR IGNORE INTO barn_workers(id,tenant,name,email,role,classification,commitment,basis,rate,onboarding,provider_ref,updated_by,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id').bind(w.id,tenant,...values,now).first();
    if(!saved){
        const prior=!w.updated&&await db.prepare('SELECT id FROM barn_workers WHERE tenant=? AND id=?').bind(tenant,w.id).first();
        if(!prior)throw Error('Worker record changed. Refresh and try again.');
    }
}
