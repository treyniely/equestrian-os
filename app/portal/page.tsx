import {cookies} from 'next/headers';
import {env} from 'cloudflare:workers';
import Portal from '../../components/portal/portal';
import {requireChatGPTUser} from '../chatgpt-auth';
import {portalEntryAcademy} from '../../server/portal-entry';
export const dynamic='force-dynamic';
export const metadata={title:'Customer portal | EquestrianOS'};
export default async function Page({searchParams}:{searchParams:Promise<{academy?:string;demo?:string}>}){
 const params=await searchParams;
 const explicit=typeof params.academy==='string'?params.academy:'';
 const demo=params.demo==='1';
 const user=await requireChatGPTUser('/portal'+(demo?'?demo=1':explicit?'?academy='+encodeURIComponent(explicit):''));
 if(demo)return <Portal demo/>;
 const initialAcademy=explicit||(env.DB?await portalEntryAcademy(env.DB,user,(await cookies()).get('eo-academy')?.value):'');
 return <Portal initialAcademy={initialAcademy}/>;
}
