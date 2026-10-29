export const features=['customers','billing','programs','schedule','riders','horses','trainers','setup','communications','team'] as const;
export type Feature=typeof features[number];export type Grants=Record<Feature,{view:boolean;manage:boolean}>;
export function roleGrants(role:string):Grants{return Object.fromEntries(features.map(f=>[f,{view:role==='owner'||role==='admin'||role==='manager'&&f!=='team'||role==='instructor'&&['schedule','riders','horses','trainers'].includes(f),manage:role==='owner'||role==='admin'||role==='manager'&&f!=='team'||role==='instructor'&&f==='schedule'}])) as Grants;}
export function can(grants:Grants,feature:Feature,manage=false){return Boolean(grants[feature]?.[manage?'manage':'view']);}
export function requiredFeature(body:Record<string,any>):Feature{switch(body.action){case 'resource':return ({trainer:'trainers',horse:'horses',rider:'riders',lesson:'programs'} as Record<string,Feature>)[body.kind]??'setup';case 'program':return 'programs';case 'customer':return 'customers';case 'membership':return 'billing';case 'draft':return 'communications';case 'teamInvite':case 'teamUpdate':return 'team';default:return 'schedule';}}
export function visibleState(state:Record<string,any>,grants:Grants){const output={...state};output.resources=state.resources.filter((r:any)=>can(grants,({trainer:'trainers',horse:'horses',rider:'riders',lesson:'programs'} as Record<string,Feature>)[r.kind]??'setup'));for(const key of ['sessions','bookings','reservations','enrollments'])if(!can(grants,'schedule'))output[key]=[];
 if(!can(grants,'customers'))output.customers=[];else if(!can(grants,'billing'))output.customers=state.customers.map((c:any)=>({...c,billing:'none',balance:0}));
 if(!can(grants,'billing'))output.memberships=[];if(!can(grants,'communications'))output.drafts=[];if(!can(grants,'team'))output.team=[];if(!can(grants,'setup'))output.audit=[];
 return output;
}
