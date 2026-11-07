import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {can} from '../../../domain/permissions';
import {accessFor} from '../../../server/team';
import {familyFor,portalAcademy} from '../../../server/portal';
import {learningAudienceSchema} from '../../../domain/learning';
import {learningItems,learningRiders,saveLearning,prepareLearningAnnouncement} from '../../../server/learning';
const headers={'Cache-Control':'private, no-store'};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
const pdfLimit=10*1024*1024,videoLimit=25*1024*1024;
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user||!env.DB)return json({error:'Sign in required.'},401);
 const q=new URL(req.url).searchParams;
 try{
 let tenant=q.get('academy')??'',customer:string|undefined,canShare=false,canTarget=false;
 if(tenant){await portalAcademy(env.DB,tenant);customer=(await familyFor(env.DB,tenant,user)).customer;}else{const ctx=await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value);if(!can(ctx.grants,'programs'))return json({error:'Learning Library access required.'},403);tenant=ctx.tenant;canShare=can(ctx.grants,'communications',true)&&can(ctx.grants,'customers')&&can(ctx.grants,'riders');canTarget=can(ctx.grants,'riders');}
 const items=await learningItems(env.DB,tenant,customer),id=q.get('file');
 if(id){const record=items.find(r=>r.id===id);if(!record)return json({error:'Resource unavailable.'},404);const objectKey=record.fileKey||(record.kind==='pdf'?'learning/'+encodeURIComponent(tenant)+'/'+id+'.pdf':'');if(!objectKey||!env.BUCKET)return json({error:'File unavailable.'},404);const head=await env.BUCKET.head(objectKey);if(!head)return json({error:'File unavailable.'},404);
 const responseHeaders:Record<string,string>={...headers,'Content-Type':record.kind==='pdf'?'application/pdf':'video/mp4','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Disposition':record.kind==='pdf'?'attachment; filename="learning-resource.pdf"':'inline'};
 const range=req.headers.get('range');let offset=0,length=head.size;
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...responseHeaders,'Content-Range':'bytes */'+head.size}});if(match[1]){offset=Number(match[1]);length=(match[2]?Math.min(Number(match[2]),head.size-1):head.size-1)-offset+1;}else{length=Math.min(Number(match[2]),head.size);offset=head.size-length;}if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||offset>=head.size||length<=0)return new Response(null,{status:416,headers:{...responseHeaders,'Content-Range':'bytes */'+head.size}});responseHeaders['Content-Range']=`bytes ${offset}-${offset+length-1}/${head.size}`;}
 const file=await env.BUCKET.get(objectKey,{range:{offset,length}});if(!file)return json({error:'File unavailable.'},404);return new Response(file.body,{status:range?206:200,headers:{...responseHeaders,'Content-Length':String(length)}});
 }
 if(customer)return json({items:items.map(({fileKey,audience,...item})=>({...item,hasFile:!!fileKey||item.kind==='pdf'})),riders:(await learningRiders(env.DB,tenant,customer)).map(r=>({id:r.id,name:r.name})),options:[],canShare:false,storageMode:'development'});
 const options=(await env.DB.prepare("SELECT id,kind,name FROM resources WHERE tenant=? AND kind IN ('level','group','rider') ORDER BY name").bind(tenant).all<{id:string;kind:string;name:string}>()).results.filter(r=>canTarget||r.kind!=='rider');
 return json({items:items.map(({fileKey,...r})=>({...r,hasFile:!!fileKey||r.kind==='pdf'})),options,canShare,canTarget,storageMode:'development'});
 }catch{return json({error:'Unable to open this academy’s Learning Library.'},403);}
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user||!env.DB)return json({error:'Sign in required.'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid request origin.'},403);
 let uploadedKey='';
 try{
 const {tenant,grants}=await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value);if(!can(grants,'programs',true))return json({error:'Learning Library management required.'},403);
 if(Number(req.headers.get('content-length'))>videoLimit+65536)return json({error:'Choose an MP4 up to 25 MB or a PDF up to 10 MB.'},413);
 let received=0;const limited=req.body?.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){received+=chunk.byteLength;if(received>videoLimit+65536)throw Error('Choose an MP4 up to 25 MB or a PDF up to 10 MB.');controller.enqueue(chunk);}}));const form=await new Response(limited,{headers:req.headers}).formData();
 if(form.get('action')==='announce'){if(!can(grants,'communications',true)||!can(grants,'customers')||!can(grants,'riders'))return json({error:'Communication management and customer and rider access are required.'},403);return json(await prepareLearningAnnouncement(env.DB,tenant,JSON.parse(String(form.get('data')))));}
 const remove=form.get('remove');if(typeof remove==='string'){const removed=await env.DB.prepare("DELETE FROM resources WHERE tenant=? AND kind='learning' AND id=? RETURNING details").bind(tenant,remove).first<{details:string}>();if(removed){const d=JSON.parse(removed.details);const key=d.fileKey||(d.kind==='pdf'?'learning/'+encodeURIComponent(tenant)+'/'+remove+'.pdf':'');if(key)await env.BUCKET?.delete(key).catch(()=>{});}return json({saved:true});}
 const data=JSON.parse(String(form.get('data')));
 if(data.audience?.mode==='selected'&&!can(grants,'riders')){const previous=(await learningItems(env.DB,tenant)).find(r=>r.id===data.id);if(!previous||JSON.stringify(previous.audience)!==JSON.stringify(learningAudienceSchema.parse(data.audience)))return json({error:'Rider viewing permission is required to change an audience.'},403);}
 let asset:undefined|{fileKey:string;fileName:string;bytes:number};const file=form.get('file');
 if(file instanceof File&&file.size){if(!env.BUCKET)throw Error('File storage is unavailable.');if(data.kind==='pdf'){if(file.size>pdfLimit||await file.slice(0,5).text()!=='%PDF-')throw Error('Choose a PDF file up to 10 MB.');}else{const buffer=new Uint8Array(await file.slice(0,12).arrayBuffer());if(file.size>videoLimit||String.fromCharCode(...buffer.slice(4,8))!=='ftyp')throw Error('Choose an MP4 file up to 25 MB.');}
 uploadedKey='learning/'+encodeURIComponent(tenant)+'/'+crypto.randomUUID()+(data.kind==='pdf'?'.pdf':'.mp4');await env.BUCKET.put(uploadedKey,file.stream(),{httpMetadata:{contentType:data.kind==='pdf'?'application/pdf':'video/mp4'}});asset={fileKey:uploadedKey,fileName:file.name.slice(0,200),bytes:file.size};}
 const result=await saveLearning(env.DB,tenant,data,asset);uploadedKey='';if(result.previousKey&&result.previousKey!==result.newKey)await env.BUCKET?.delete(result.previousKey).catch(()=>{});return json({saved:true,id:result.id});
 }catch(e){if(uploadedKey)await env.BUCKET?.delete(uploadedKey).catch(()=>{});const message=e instanceof Error?e.message:'';return json({error:/^Choose|^File storage|^Resource not|^This resource|^Publish|^No eligible/.test(message)?message:'Unable to save. Check the resource and audience fields.'},400);}
}
