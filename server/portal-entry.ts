import {academyChoices} from './academies.ts';
/** Resolve only academies already owned, staffed, or joined by this account. */
export async function portalEntryAcademy(db:D1Database,user:{userId:string;email:string},selected?:string){
 const choices=await academyChoices(db,user);
 const families=(await db.prepare('SELECT tenant FROM family_accounts WHERE user_id=? ORDER BY created').bind(user.userId).all<{tenant:string}>()).results;
 const allowed=[...choices.map(c=>c.id),...families.map(f=>f.tenant)];
 if(selected&&allowed.includes(selected))return selected;
 return families[0]?.tenant??choices[0]?.id??'';
}
