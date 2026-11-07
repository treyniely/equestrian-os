'use client';

import {useEffect,useState} from 'react';
import {can,type Grants} from '../../domain/permissions';
import {localDate} from '../../domain/barn';
import Dialog from './dialog';

type Entry={id:string;staff:string;name:string;day:string;minutes:number;lessons:number;note:string;approved:number;revision:number};
type PayPeriod={start:string;end:string};
type Review={entries:Entry[];staff:{id:string;name:string}[];exports:(PayPeriod&{id:string;created:number})[]};

async function request(input:object){
    const response=await fetch('/api/pay-inputs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    if(!response.ok)throw Error(((await response.json()) as {error:string}).error);
    return response;
}

export default function PayInputs({grants,zone}:{grants:Grants;zone:string}){
    const today=localDate(Date.now(),zone);
    const [range,setRange]=useState<PayPeriod>({start:today.slice(0,7)+'-01',end:today});
    const [review,setReview]=useState<{period:PayPeriod;data:Review}|null>(null);
    const [editing,setEditing]=useState<Partial<Entry>|null>(null);
    const [confirm,setConfirm]=useState(false);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const approve=can(grants,'timeApproval',true);
    const exportPay=can(grants,'payroll',true);
    async function read(period:PayPeriod){
        const response=await request({action:'read',...period});
        setReview({period,data:await response.json()});
    }
    async function run(task:()=>Promise<void>){
        setBusy(true);
        setError('');
        try{await task();}catch(e){setError(e instanceof Error?e.message:'Unable to update work entries.');}
        finally{setBusy(false);}
    }
    useEffect(()=>{void run(()=>read({start:today.slice(0,7)+'-01',end:today}));},[today]);
    const loaded=review?.period.start===range.start&&review?.period.end===range.end;
    const data=loaded?review?.data:undefined;
    const exact=data?.exports.some(p=>p.start===range.start&&p.end===range.end);
    const locked=(day:string)=>data?.exports.some(p=>p.start<=day&&p.end>=day);
    const pending=data?.entries.filter(e=>!e.approved).length??0;
    return <section className="panel pay-inputs">
        <div className="panel-heading"><div><h2>Time review & payroll export</h2><p>Record actual work, approve entries, then download a CSV for your payroll provider.</p></div>
            {approve&&data&&<button className="primary" disabled={busy||!data.staff.length} onClick={()=>{setError('');setEditing({day:range.end});}}>Add work entry</button>}
        </div>
        <form className="pay-range" onSubmit={event=>{event.preventDefault();void run(()=>read(range));}}>
            <label>Period start<input type="date" required value={range.start} onChange={e=>setRange({...range,start:e.target.value})}/></label>
            <label>Period end<input type="date" required min={range.start} value={range.end} onChange={e=>setRange({...range,end:e.target.value})}/></label>
            <button className="secondary" disabled={busy}>Review period</button>
        </form>
        {error&&!editing&&!confirm&&<p className="error" role="alert">{error}</p>}
        {data&&<>
            <div className="panel-heading">
                <p>{data.entries.length} work entries · {pending} awaiting approval{exact?' · Exported':''}</p>
                {exportPay&&<button className="secondary" disabled={busy||(!exact&&(!data.entries.length||!!pending||!!data.exports.length))} onClick={()=>{setError('');setConfirm(true);}}>{exact?'Download saved CSV':'Export approved work'}</button>}
            </div>
            {data.exports.length>0&&<p className="pay-hint">Exported periods are locked. {data.exports.map(p=>p.start+' to '+p.end).join(', ')}</p>}
            {!data.entries.length&&<div className="empty">{approve&&!data.staff.length?'Add a paid worker in Barn team to get started.':'No work entries in this period.'}</div>}
            {data.entries.length>0&&<div className="table-scroll"><table><thead><tr><th>Staff member</th><th>Work date</th><th>Actual work</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{data.entries.map(entry=><tr key={entry.id}>
                    <td><strong>{entry.name}</strong></td><td>{entry.day}</td>
                    <td>{entry.minutes} min · {entry.lessons} lessons<small className="pay-note">{entry.note}</small></td>
                    <td>{locked(entry.day)?'Exported':entry.approved?'Approved':'Draft'}</td>
                    <td><div className="button-row">{approve&&!locked(entry.day)&&<>
                        <button className="secondary" disabled={busy} onClick={()=>{setError('');setEditing(entry);}}>Edit</button>
                        {!entry.approved&&<button className="secondary" disabled={busy} onClick={()=>void run(async()=>{await request({action:'approve',id:entry.id,revision:entry.revision});await read(range);})}>Approve</button>}
                    </>}</div></td>
                </tr>)}</tbody></table></div>}
        </>}
        {editing&&data&&<Dialog title={editing.id?'Correct work entry':'Add work entry'} onClose={()=>{if(!busy)setEditing(null);}}>
            <form onSubmit={event=>{
                event.preventDefault();
                const form=new FormData(event.currentTarget);
                void run(async()=>{
                    await request({action:'save',id:editing.id,revision:editing.revision,staff:form.get('staff'),day:form.get('day'),minutes:Number(form.get('minutes')),lessons:Number(form.get('lessons')),note:form.get('note')});
                    setEditing(null);
                    await read(range);
                });
            }}>
                <label>Team member<select name="staff" defaultValue={editing.staff??''} required><option value="">Select staff</option>{data.staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
                <label>Work date<input name="day" type="date" min={range.start} max={range.end} defaultValue={editing.day} required/></label>
                <div className="form-grid"><label>Actual paid minutes<input name="minutes" type="number" min="0" max="1440" defaultValue={editing.minutes??0} required/></label>
                <label>Completed lessons<input name="lessons" type="number" min="0" max="100" defaultValue={editing.lessons??0} required/></label></div>
                <label>{editing.id?'Correction reason':'Work performed'}<textarea name="note" required maxLength={400} defaultValue={editing.id?'':editing.note}/></label>
                {editing.approved? <p className="form-note">A correction requires approval again.</p>:null}
                {error&&<p className="error" role="alert">{error}</p>}
                <button className="primary submit" disabled={busy}>Save draft</button>
            </form>
        </Dialog>}
        {confirm&&data&&<Dialog title={exact?'Download approved work':'Confirm payroll export'} onClose={()=>{if(!busy)setConfirm(false);}}>
            <p>{range.start} through {range.end} · {data.entries.length} approved entries</p>
            <p>{exact?'Download the saved snapshot for this period.':'Exporting locks these work entries. This CSV is a record of approved work for your payroll provider.'}</p>
            {error&&<p className="error" role="alert">{error}</p>}
            <button className="primary" disabled={busy} onClick={()=>void run(async()=>{
                const response=await request({action:'export',...range,reviewed:JSON.stringify(data.entries.map(entry=>[entry.id,entry.revision]))});
                const url=URL.createObjectURL(await response.blob());
                const link=document.createElement('a');
                link.href=url;
                link.download='approved-pay-inputs-'+range.start+'-'+range.end+'.csv';
                link.click();
                setTimeout(()=>URL.revokeObjectURL(url),1000);
                setConfirm(false);
                await read(range);
            })}>{exact?'Download CSV':'Lock period and download CSV'}</button>
        </Dialog>}
    </section>;
}
