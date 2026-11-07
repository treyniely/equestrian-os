import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {can} from '../../../domain/permissions';
import {accessFor} from '../../../server/team';
import {getCommunicationSettings,saveCommunicationSettings,changeCommunicationDraft} from '../../../server/communication-settings';
import {ZodError} from 'zod';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request,save=false){try{
 if(save&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to continue.'},401);if(!env.DB)return json({error:'Database unavailable.'},503);
 const {tenant,grants}=await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value);
 if(!can(grants,'communications',save))return json({error:'Communication '+(save?'management':'viewing')+' permission is required.'},403);
 const body=save?await request.json() as Record<string,unknown>:undefined;
 if(body?.action)return json(await changeCommunicationDraft(env.DB,tenant,grants,body));
 const settings=save?await saveCommunicationSettings(env.DB,tenant,body):await getCommunicationSettings(env.DB,tenant);
 return json({settings,delivery:{email:'not-connected',sms:'not-connected'}});
 }catch(error){const message=error instanceof Error?error.message:'';if(message==='ACCESS_REVOKED')return json({error:'Academy access required.'},403);if(message.startsWith('Draft changed')||message.startsWith('Communication settings changed'))return json({error:message},409);if(/permission|required for this draft/.test(message))return json({error:message},403);if(/^(Draft not found|Publish|Restore|Choose|Remove flagged)/.test(message))return json({error:message},400);return json({error:error instanceof ZodError?'Review the automation settings and try again.':'Unable to load or save communication settings.'},400);}}
export async function GET(request:Request){return handle(request);}
export async function POST(request:Request){return handle(request,true);}
