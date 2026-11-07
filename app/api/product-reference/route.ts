import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {accessFor} from '../../../server/team';
import {can} from '../../../domain/permissions';
import {productReferenceMarkdown} from '../../../domain/product-reference';
export async function GET(){
 const headers={'Cache-Control':'private, no-store'};
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in required.'},{status:401,headers});
 if(!env.DB)return Response.json({error:'Database unavailable.'},{status:503,headers});
 try{const ctx=await accessFor(env.DB,user,(await cookies()).get('eo-academy')?.value);if(!can(ctx.grants,'setup'))return Response.json({error:'Academy setup viewing permission required.'},{status:403,headers});
 return new Response(productReferenceMarkdown(),{headers:{...headers,'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':'attachment; filename="EquestrianOS_Product_Reference.md"','X-Content-Type-Options':'nosniff'}});
 }catch{return Response.json({error:'Academy access required.'},{status:403,headers});}
}
