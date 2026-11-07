import {readBarnWorkers,saveBarnWorker} from '../../../server/barn-workers';
import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {can} from '../../../domain/permissions';
import {accessFor} from '../../../server/team';
import {changePayInputs,readPayInputs} from '../../../server/pay-inputs';

const headers={'Cache-Control':'private, no-store'};
const json=(value:unknown,status=200)=>Response.json(value,{status,headers});
const csvCell=(value:unknown)=>{
    const text=String(value??'');
    return '"'+(/^[\s]*[=+\-@]|^[\t\r\n]/.test(text)?"'":'')+text.replaceAll('"','""')+'"';
};

export async function POST(request:Request){
    try{
        if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
        const user=await getChatGPTUser();
        if(!user)return json({error:'Sign in to continue.'},401);
        if(!env.DB)return json({error:'Database unavailable.'},503);
        const {tenant,grants}=await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value);
        const body=await request.json() as Record<string,unknown>;
        if(body.action==='workers'||body.action==='saveWorker'){
            if(!can(grants,'payroll',body.action==='saveWorker'))return json({error:'Payroll access is required.'},403);
            if(body.action==='saveWorker')await saveBarnWorker(env.DB,tenant,user.userId,body);
            return json(await readBarnWorkers(env.DB,tenant));
        }
        const feature=body.action==='export'?'payroll':'timeApproval';
        if(body.action==='read'){
            if(!can(grants,'timeApproval')&&!can(grants,'payroll'))return json({error:'Time review or payroll access is required.'},403);
            return json(await readPayInputs(env.DB,tenant,grants,body));
        }
        if(!can(grants,feature,true))return json({error:'Management access is required.'},403);
        const result=await changePayInputs(env.DB,tenant,grants,user.userId,body);
        if(body.action!=='export')return json(result);
        const rows=result as Array<{staff:string;name:string;day:string;minutes:number;lessons:number}>;
        const csv=['Team member ID,Name,Work date,Approved minutes,Completed lessons',...rows.map(r=>[r.staff,r.name,r.day,r.minutes,r.lessons].map(csvCell).join(','))].join('\r\n');
        return new Response(csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="approved-pay-inputs.csv"'}});
    }catch(error){
        const message=error instanceof Error?error.message:'';
        if(message==='ACCESS_REVOKED')return json({error:'Academy access required.'},403);
        if(message.includes('pay_period_locked'))return json({error:'This date belongs to an exported pay period.'},409);
        if(message.includes('pay_period_unavailable'))return json({error:'Approve all entries and choose a period that does not overlap an export.'},409);
        if(message.startsWith('Work entries changed')||message.startsWith('Worker record changed'))return json({error:message},409);
        if(message==='Choose an active team member.'||message.startsWith('This work entry changed'))return json({error:message},400);
        return json({error:'Check the work entry or date range and try again.'},400);
    }
}
