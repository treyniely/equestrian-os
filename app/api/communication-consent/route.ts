import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {readOperationalConsent,saveOperationalConsent} from '../../../server/communication-consent';
import {ZodError} from 'zod';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){return handle(req,false);}
export async function POST(req:Request){return handle(req,true);}
async function handle(req:Request,write:boolean){
    const user=await getChatGPTUser();
    if(!user)return Response.json({error:'Please sign in to continue.'},{status:401,headers});
    if(!env.DB)return Response.json({error:'Service temporarily unavailable.'},{status:503,headers});
    if(write&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request origin.'},{status:403,headers});
    try{
        const academy=new URL(req.url).searchParams.get('academy')??'';
        const result=write?await saveOperationalConsent(env.DB,academy,user,await req.json()):await readOperationalConsent(env.DB,academy,user);
        return Response.json(result,{headers});
    }catch(e){
        const message=e instanceof ZodError?'Please choose your lesson and schedule preferences.':e instanceof Error?e.message:'';
        const safe=/^(Family account access required|An adult account holder|Add an email address|Add a phone number)/.test(message)?message:'Unable to save communication preferences. Please try again.';
        return Response.json({error:safe},{status:message==='Family account access required.'?403:400,headers});
    }
}
