import type {BillingSummary} from '../domain/subscriptions';
export async function billingRequest(data:Record<string,unknown>,academy?:string){const r=await fetch('/api/billing'+(academy?'?academy='+encodeURIComponent(academy):''),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),body=await r.json() as any;if(!r.ok)throw Error(body.error??'Unable to load billing.');return body;}
export function openBillingUrl(url:string){const target=new URL(url);if(target.protocol!=='https:'||!['checkout.stripe.com','billing.stripe.com','connect.stripe.com'].includes(target.hostname))throw Error('Invalid payment destination.');window.location.assign(target.href);}
export type {BillingSummary};
