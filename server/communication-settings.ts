import {communicationSettingsSchema,readCommunicationSettings,defaultCommunicationSettings} from '../domain/communication-settings.ts';
const settingsId=(tenant:string)=>'communication-settings:'+tenant;
export function defaultCommunicationSetupWrite(db:D1Database,tenant:string){
 return db.prepare("INSERT OR IGNORE INTO resources(id,tenant,kind,name,details) VALUES(?,?,'communication-settings','Communication setup',?)").bind(settingsId(tenant),tenant,JSON.stringify({...defaultCommunicationSettings(),revision:1}));
}
export async function getCommunicationSettings(db:D1Database,tenant:string){const record=await db.prepare("SELECT details FROM resources WHERE tenant=? AND id=? AND kind='communication-settings'").bind(tenant,settingsId(tenant)).first<{details:string}>();return readCommunicationSettings(record?JSON.parse(record.details):undefined);}
export async function saveCommunicationSettings(db:D1Database,tenant:string,input:unknown){
 const settings=communicationSettingsSchema.parse(input),next={...settings,revision:settings.revision+1};
 const statement=settings.revision===0
  ?await db.prepare("INSERT OR IGNORE INTO resources(id,tenant,kind,name,details) VALUES(?,?,'communication-settings','Communication setup',?) RETURNING id").bind(settingsId(tenant),tenant,JSON.stringify(next))
  :await db.prepare("UPDATE resources SET details=? WHERE tenant=? AND id=? AND kind='communication-settings' AND json_extract(details,'$.revision')=? RETURNING id").bind(JSON.stringify(next),tenant,settingsId(tenant),settings.revision);
 const [saved]=await db.batch([statement,db.prepare('INSERT INTO audit(id,tenant,action,created) SELECT ?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),tenant,'Prepared communication settings; provider delivery remains off',Date.now())]);
 if(Number(saved.meta?.changes??(saved as unknown as {changes:number}).changes)!==1)throw Error('Communication settings changed. Refresh before saving again.');
 return next;
}

// Drafts are staged intent only. These operations never enqueue or dispatch messages.
import {z} from 'zod';
import {can,type Grants} from '../domain/permissions.ts';
import {audiencePreview,contactBlockReasons,defaultFilters} from '../domain/audiences.ts';
import {readWorkspace} from './workspace.ts';
import {learningItems,learningRiders} from './learning.ts';
import {matchingLearningRiders} from '../domain/learning.ts';
const draftCommand=z.object({action:z.enum(['updateDraft','archiveDraft','restoreDraft','previewDraft']),id:z.string().min(1).max(100),revision:z.number().int().nonnegative().default(0),name:z.string().trim().min(1).max(100).optional(),message:z.string().trim().min(1).max(2000).optional(),subject:z.string().trim().min(1).max(200).optional(),channel:z.enum(['email','sms']).optional(),scheduleAt:z.number().int().positive().nullable().optional(),excludedIds:z.array(z.string().min(1).max(100)).max(5000).optional()});
async function draftContext(db:D1Database,tenant:string,grants:Grants,id:string){
 if(!can(grants,'communications',true)||!can(grants,'customers'))throw Error('Draft management and customer viewing permission are required.');
 const row=await db.prepare('SELECT * FROM drafts WHERE tenant=? AND id=?').bind(tenant,id).first<{id:string;kind:string;name:string;segment:string;channel:string;message:string;audience:string}>();if(!row)throw Error('Draft not found.');
 const metadata=JSON.parse(row.audience||'{}');
 if((metadata.filters?.level||metadata.filters?.riderGroup||metadata.resourceAudience?.mode==='selected')&&!can(grants,'riders'))throw Error('Rider viewing permission is required for this draft.');
 if(metadata.resource&&!can(grants,'programs'))throw Error('Learning Library viewing permission is required for this draft.');
 if(['Needs attention','Active members','Active','Inactive'].includes(metadata.filters?.segment??row.segment)&&!can(grants,'billing'))throw Error('Billing viewing permission is required for this draft.');
 return {row,metadata};
}
export async function reviewCommunicationDraft(db:D1Database,tenant:string,grants:Grants,input:unknown){
 const d=draftCommand.parse(input),{row,metadata}=await draftContext(db,tenant,grants,d.id),channel=d.channel??row.channel,excludedIds=d.excludedIds??metadata.excludedIds??[];
 const workspace=await readWorkspace(db,tenant);
 if(metadata.resource){
  const item=(await learningItems(db,tenant)).find(r=>r.id===metadata.resource);if(!item?.published)throw Error('Publish the learning resource before reviewing its announcement.');
  if(item.audience.mode==='selected'&&!can(grants,'riders'))throw Error('Rider viewing permission is required for this draft.');
  const riders=await learningRiders(db,tenant),customerIds=new Set(matchingLearningRiders(item.audience,riders).map(r=>r.details.customer)),selected=workspace.customers.filter((c:any)=>item.audience.mode==='everyone'||customerIds.has(c.id)),included=selected.filter((c:any)=>!excludedIds.includes(c.id));
  return {row,metadata:{...metadata,resourceAudience:item.audience},excludedIds,selected,eligible:included.filter((c:any)=>!contactBlockReasons(c,channel).length),blocked:included.flatMap((c:any)=>{const reasons=contactBlockReasons(c,channel);return reasons.length?[{customer:c,reasons}]:[];})};
 }
 return {row,metadata,excludedIds,...audiencePreview({...workspace,customerGroups:workspace.customer_groups} as any,{...defaultFilters,segment:row.segment,...metadata.filters},channel,excludedIds)};
}
export async function changeCommunicationDraft(db:D1Database,tenant:string,grants:Grants,input:unknown){
 const d=draftCommand.parse(input);if(d.action==='previewDraft'){const preview=await reviewCommunicationDraft(db,tenant,grants,d);return {eligible:preview.eligible.map((c:any)=>({id:c.id,name:c.name,address:(d.channel??preview.row.channel)==='sms'?c.phone:c.email})),blocked:preview.blocked.map((b:any)=>({id:b.customer.id,name:b.customer.name,reasons:b.reasons})),selected:preview.selected.length,excludedIds:preview.excludedIds};}
 const {row,metadata}=await draftContext(db,tenant,grants,d.id);if((metadata.revision??0)!==d.revision)throw Error('Draft changed. Refresh before saving again.');
 let next={...metadata,revision:d.revision+1},channel=row.channel,name=row.name,message=row.message;
 if(d.action==='updateDraft'){
  if(metadata.archived)throw Error('Restore this draft before editing.');
  if(!d.message||!d.name||!d.channel||d.channel==='email'&&!d.subject)throw Error('Choose a name, channel, subject and message.');
  if(d.scheduleAt!=null&&(d.scheduleAt<=Date.now()||d.scheduleAt>Date.now()+366*24*60*60*1000))throw Error('Choose a future send time within the next year.');
  const preview=await reviewCommunicationDraft(db,tenant,grants,d);if(preview.blocked.length)throw Error('Remove flagged contacts before saving the reviewed draft.');if(!preview.eligible.length)throw Error('Choose at least one eligible contact.');
  channel=d.channel;name=d.name;message=d.message;
  next={...next,...preview.metadata,revision:d.revision+1,subject:d.subject??metadata.subject,excludedIds:preview.excludedIds,eligibleIds:preview.eligible.map((c:any)=>c.id),eligibleCount:preview.eligible.length,scheduleAt:d.scheduleAt??null,scheduleZone:'UTC',reviewedAt:Date.now(),delivery:'not-connected'};
 }else next={...next,archived:d.action==='archiveDraft',archivedAt:d.action==='archiveDraft'?Date.now():null};
 const [saved]=await db.batch([db.prepare('UPDATE drafts SET name=?,channel=?,message=?,audience=? WHERE tenant=? AND id=? AND audience=? RETURNING id').bind(name,channel,message,JSON.stringify(next),tenant,row.id,row.audience),db.prepare('INSERT INTO audit(id,tenant,action,created) SELECT ?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),tenant,(d.action==='archiveDraft'?'Archived':d.action==='restoreDraft'?'Restored':'Updated reviewed')+' unsent communication draft: '+name,Date.now())]);
 if(Number(saved.meta?.changes??(saved as unknown as {changes:number}).changes)!==1)throw Error('Draft changed. Refresh before saving again.');
 return {saved:true,delivery:'not-connected'};
}
