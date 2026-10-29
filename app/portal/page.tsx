import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';
import Portal from '../../components/portal/portal';
import {requireChatGPTUser} from '../chatgpt-auth';
import {portalEntryAcademy} from '../../server/portal-entry';
export const dynamic='force-dynamic';
export const metadata={title:'Customer portal | EquestrianOS'};
export default async function Page({searchParams}:{searchParams:Promise<{academy?:string}>}){
 const params=await searchParams;
 const explicit=typeof params.academy==='string'?params.academy:'';
 const user=await requireChatGPTUser('/portal'+(explicit?'?academy='+encodeURIComponent(explicit):''));
 const initialAcademy=explicit||(env.DB?await portalEntryAcademy(env.DB,user,(await cookies()).get('eo-academy')?.value):'');
 return <Portal initialAcademy={initialAcademy}/>;
}
