export async function academyChoices(db:D1Database,user:{userId:string;email:string}){
 const owned=(await db.prepare('SELECT id,name FROM academies WHERE owner=? ORDER BY created').bind(user.userId).all<{id:string;name:string}>()).results;
 const shared=(await db.prepare("SELECT t.tenant as id,COALESCE(a.name,(SELECT name FROM resources WHERE tenant=t.tenant AND kind='academy' LIMIT 1),'Academy') as name FROM team_access t LEFT JOIN academies a ON a.id=t.tenant WHERE t.user_id=? AND t.status='active'").bind(user.userId).all<{id:string;name:string}>()).results;
 const existing=await db.prepare("SELECT name FROM resources WHERE tenant=? AND kind='academy' LIMIT 1").bind(user.userId).first<{name:string}>();
 const hasData=await db.prepare('SELECT id FROM resources WHERE tenant=? LIMIT 1').bind(user.userId).first();
 return [...(existing||hasData||owned.length||!shared.length?[{id:user.userId,name:existing?.name??'My academy'}]:[]),...owned,...shared].filter((r,i,all)=>all.findIndex(x=>x.id===r.id)===i);
}
