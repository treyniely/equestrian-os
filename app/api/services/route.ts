import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {accessFor} from '../../../server/team';
import {readServiceSetup,saveServiceSetup} from '../../../server/service-setup';
import type {BillingEnv} from '../../../server/billing/stripe';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function context(){
    const user=await getChatGPTUser();
    if(!user)throw Error('Sign in required.');
    if(!env.DB)throw Error('Workspace unavailable.');
    return {db:env.DB,...await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value)};
}
export async function GET(){
    try{const {db,tenant,grants}=await context();return json({services:await readServiceSetup(db,tenant,grants,env as BillingEnv)});}
    catch(e){return json({error:e instanceof Error?e.message:'Unable to load service status.'},403);}
}
export async function POST(req:Request){
    if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request origin.'},403);
    try{
        const {db,tenant,grants}=await context();
        await saveServiceSetup(db,tenant,grants,await req.json());
        return json({services:await readServiceSetup(db,tenant,grants,env as BillingEnv)});
    }catch(e){const message=e instanceof Error?e.message:'';return json({error:/permission|access|Sign in/.test(message)?message:'Unable to save setup preferences. Check the fields and try again.'},400);}
}
