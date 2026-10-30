import {cookies} from 'next/headers';
import {accessFor} from '../../../server/team';import {can} from '../../../domain/permissions';
import {env} from 'cloudflare:workers';import {getChatGPTUser} from '../../chatgpt-auth';import {imageType,photoIdPattern} from '../../../domain/photos';
const key=(tenant:string,id:string)=>'profiles/'+encodeURIComponent(tenant)+'/'+id;
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required.'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403});
 if(!env.BUCKET)return Response.json({error:'Photo storage unavailable. Please try later.'},{status:503});
 const access=env.DB?await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value).catch(()=>null):null;if(!access||!['horses','trainers','riders','setup'].some(f=>can(access.grants,f as 'horses'|'trainers'|'riders'|'setup',true)))return Response.json({error:'Photo editing permission required.'},{status:403});
 const body=request.body;if(!body)return Response.json({error:'Choose an image.'},{status:400});
 const reader=body.getReader(),parts:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2*1024*1024){await reader.cancel();return Response.json({error:'Photo must be smaller than 2 MB.'},{status:413});}parts.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 const type=imageType(bytes);if(!type||type!==request.headers.get('content-type'))return Response.json({error:'Use a JPEG, PNG or WebP image.'},{status:400});
 const id=crypto.randomUUID();await env.BUCKET.put(key(access.tenant,id),bytes,{httpMetadata:{contentType:type}});return Response.json({id});
}
export async function GET(request:Request){const user=await getChatGPTUser();if(!user)return new Response(null,{status:401});const id=new URL(request.url).searchParams.get('id')??'';if(!photoIdPattern.test(id))return new Response(null,{status:400});const access=env.DB?await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value).catch(()=>null):null;if(!access)return new Response(null,{status:403});const matches=await env.DB!.prepare("SELECT kind FROM resources WHERE tenant=? AND json_extract(details,'$.photoId')=?").bind(access.tenant,id).all<{kind:string}>();if(!matches.results.some(r=>can(access.grants,r.kind==='horse'?'horses':r.kind==='trainer'?'trainers':r.kind==='rider'?'riders':'setup')))return new Response(null,{status:403});const object=await env.BUCKET?.get(key(access.tenant,id));if(!object)return new Response(null,{status:404});return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType??'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':matches.results.some(r=>r.kind==='rider')?'private, no-store':'private, max-age=300','Content-Security-Policy':"default-src 'none'"}});}
