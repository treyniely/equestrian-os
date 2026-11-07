'use client';

import {useEffect,useState} from 'react';
import Dialog from './dialog';

type Worker={
    id:string;updated:number;name:string;email:string;role:string;classification:string;
    commitment:string;basis:string;rate:number;onboarding:string;providerRef:string;
};
const roleLabels:Record<string,string>={trainer:'Trainer',intern:'Intern','barn-staff':'Barn staff',manager:'Manager',other:'Other'};
const classificationLabels:Record<string,string>={employee:'Employee',contractor:'Independent contractor',unpaid:'Unpaid placement',pending:'Classification pending'};
const basisLabels:Record<string,string>={hourly:'Hourly',salary:'Annual salary','per-lesson':'Per lesson',fixed:'Fixed contract amount'};
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});

async function request(body:object):Promise<Worker[]>{
    const response=await fetch('/api/pay-inputs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!response.ok)throw Error(((await response.json()) as {error:string}).error);
    return await response.json() as Worker[];
}

export default function BarnWorkers({manage,onSaved}:{manage:boolean;onSaved:()=>void}){
    const [workers,setWorkers]=useState<Worker[]|null>(null);
    const [editing,setEditing]=useState<Worker|null>(null);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    useEffect(()=>{request({action:'workers'}).then(setWorkers).catch(e=>setError(e.message));},[]);
    function open(worker?:Worker){
        setError('');
        setEditing(worker??{id:crypto.randomUUID(),updated:0,name:'',email:'',role:'barn-staff',classification:'pending',commitment:'part-time',basis:'pending',rate:0,onboarding:'new',providerRef:''});
    }
    const paid=editing?.classification==='employee'||editing?.classification==='contractor';
    const bases=editing?.classification==='employee'?['hourly','salary','per-lesson']:['hourly','per-lesson','fixed'];
    return <section className="panel">
        <div className="panel-heading"><div><h2>Staff roster</h2><p>Set up paid and unpaid workers, whether or not they need a software login.</p></div>
            {manage&&workers&&<button className="primary" onClick={()=>open()}>Add worker</button>}
        </div>
        {error&&!editing&&<p className="error pay-hint" role="alert">{error}</p>}
        {!workers&& !error&&<p className="pay-hint">Loading staff roster…</p>}
        {workers?.length===0&&<div className="empty">Add a worker to start setting up payroll.</div>}
        {!!workers?.length&&<div className="table-scroll"><table><thead><tr><th>Worker</th><th>Work arrangement</th><th>Compensation</th><th>Onboarding</th><th>Actions</th></tr></thead>
            <tbody>{workers.map(worker=><tr key={worker.id}>
                <td><strong>{worker.name}</strong><small>{roleLabels[worker.role]}{worker.email?' · '+worker.email:''}</small></td>
                <td>{classificationLabels[worker.classification]} · {worker.commitment}</td>
                <td>{worker.rate?money.format(worker.rate/100)+' · '+basisLabels[worker.basis]:'—'}</td>
                <td>{worker.onboarding==='existing'?'Existing worker':'New worker'}</td>
                <td>{manage&&<button className="secondary" onClick={()=>open(worker)}>Edit setup</button>}</td>
            </tr>)}</tbody></table></div>}
        {editing&&<Dialog title={editing.updated?'Edit worker setup':'Add a barn worker'} onClose={()=>{if(!busy)setEditing(null);}}>
            <form onSubmit={async event=>{
                event.preventDefault();
                const form=new FormData(event.currentTarget);
                setBusy(true);setError('');
                try{
                    setWorkers(await request({action:'saveWorker',...editing,name:form.get('name'),email:form.get('email'),role:form.get('role'),commitment:form.get('commitment'),onboarding:form.get('onboarding'),providerRef:form.get('providerRef')??'',basis:paid?form.get('basis'):editing.classification,rate:paid?Math.round(Number(form.get('rate'))*100):0}));
                    setEditing(null);
                    onSaved();
                }catch(e){setError(e instanceof Error?e.message:'Unable to save worker.');}
                finally{setBusy(false);}
            }}>
                <label>Name<input name="name" required maxLength={100} defaultValue={editing.name}/></label>
                <label>Work email · optional<input name="email" type="email" maxLength={200} defaultValue={editing.email}/></label>
                <label>Barn role<select name="role" defaultValue={editing.role}>{Object.entries(roleLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                <div className="form-grid">
                    <label>Payroll classification<select value={editing.classification} onChange={e=>setEditing({...editing,classification:e.target.value,basis:'hourly',rate:0})}>
                        {Object.entries(classificationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
                    </select></label>
                    <label>Work arrangement<select name="commitment" defaultValue={editing.commitment}>
                        <option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="seasonal">Seasonal</option><option value="as-needed">As needed</option>
                    </select></label>
                </div>
                {paid&&<div className="form-grid" key={editing.classification}>
                    <label>Pay basis<select name="basis" defaultValue={editing.basis}>{bases.map(b=><option key={b} value={b}>{basisLabels[b]}</option>)}</select></label>
                    <label>Pay amount · USD<input name="rate" type="number" min="0.01" max="1000000" step="0.01" required defaultValue={editing.rate?editing.rate/100:''}/></label>
                </div>}
                <label>Payroll onboarding<select name="onboarding" defaultValue={editing.onboarding}><option value="new">New worker</option><option value="existing">Existing worker · moving payroll</option></select></label>
                {paid&&<label>Existing payroll worker ID · optional<input name="providerRef" maxLength={100} defaultValue={editing.providerRef}/></label>}
                <p className="form-note">This saves the worker’s setup in EquestrianOS. Secure forms and invitations will be handled through the payroll provider when connected.</p>
                {error&&<p className="error" role="alert">{error}</p>}
                <button className="primary submit" disabled={busy}>Save worker</button>
            </form>
        </Dialog>}
    </section>;
}
