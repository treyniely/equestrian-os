// Stripe HTTP and signature boundary. Secrets never leave the server.
export type BillingEnv={STRIPE_BILLING_ENABLED?:string;STRIPE_SECRET_KEY?:string;STRIPE_CONNECT_CLIENT_ID?:string;STRIPE_WEBHOOK_SECRET?:string};
export type StripeObject=Record<string,any>;
export type StripeCall=(path:string,params?:Record<string,string>,account?:string,key?:string)=>Promise<StripeObject>;
export function billingConfigured(env:BillingEnv){return env.STRIPE_BILLING_ENABLED==='true'&&!!(env.STRIPE_SECRET_KEY&&env.STRIPE_CONNECT_CLIENT_ID&&env.STRIPE_WEBHOOK_SECRET)}
export function stripeClient(env:BillingEnv):StripeCall{return async(path,params,account,key)=>{
 if(!env.STRIPE_SECRET_KEY)throw Error('Stripe has not been configured for this workspace.');
 const headers:Record<string,string>={Authorization:'Bearer '+env.STRIPE_SECRET_KEY,'Stripe-Version':'2024-06-20'};
 if(account)headers['Stripe-Account']=account;if(key)headers['Idempotency-Key']=key;
 if(params)headers['Content-Type']='application/x-www-form-urlencoded';
 const r=await fetch('https://api.stripe.com/v1/'+path,{method:params?'POST':'GET',headers,body:params?new URLSearchParams(params):undefined});
 const data=await r.json() as StripeObject;if(!r.ok){console.error('Stripe request failed',r.status,data.error?.type,data.error?.code);throw Error('Stripe could not complete this request. Please try again or contact your academy.');}return data;
};}
export async function verifyStripeEvent(body:string,signature:string,secret:string,now=Date.now()):Promise<StripeObject>{
 const parts=signature.split(','),stamp=parts.find(x=>x.startsWith('t='))?.slice(2),signatures=parts.filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));
 if(!stamp||!/^\d+$/.test(stamp)||Math.abs(now/1000-Number(stamp))>300||!signatures.length)throw Error('Invalid Stripe signature.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(stamp+'.'+body)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(!signatures.some(s=>{if(s.length!==digest.length)return false;let difference=0;for(let i=0;i<s.length;i++)difference|=s.charCodeAt(i)^digest.charCodeAt(i);return difference===0}))throw Error('Invalid Stripe signature.');
 return JSON.parse(body);
}
