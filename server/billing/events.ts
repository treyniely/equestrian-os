import {purchasablePlan} from '../../domain/subscriptions.ts';
import {localDate} from '../../domain/barn.ts';
import type {StripeCall,StripeObject} from './stripe.ts';
const objectId=(v:any)=>typeof v==='string'?v:v?.id;
export async function processBillingEvent(db:D1Database,event:StripeObject,stripe:StripeCall){
 if(typeof event.id!=='string'||typeof event.account!=='string')throw Error('Expected a connected-account event.');
 if(await db.prepare('SELECT id FROM billing_events WHERE id=? AND account=?').bind(event.id,event.account).first())return;
 const account=await db.prepare('SELECT * FROM billing_accounts WHERE account=?').bind(event.account).first<any>();if(!account)return;
 if(Boolean(event.livemode)!==Boolean(account.live))throw Error('Stripe event mode does not match the connected account.');
 if(event.type==='account.application.deauthorized'){await db.batch([db.prepare('DELETE FROM billing_accounts WHERE account=?').bind(event.account),db.prepare("UPDATE rider_subscriptions SET status='disconnected',updated=? WHERE account=?").bind(Date.now(),event.account),db.prepare('INSERT OR IGNORE INTO billing_events VALUES(?,?,?)').bind(event.id,event.account,Date.now()),db.prepare('INSERT INTO audit VALUES(?,?,?,?)').bind(crypto.randomUUID(),account.tenant,'Stripe account disconnected. Subscriptions must be managed in Stripe until reconnected.',Date.now())]);return;}
 const supported=['invoice.paid','invoice.payment_failed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','checkout.session.completed','checkout.session.expired'];
 if(!supported.includes(event.type))return;
 const eventObject=event.data?.object;if(!eventObject?.id)throw Error('Missing Stripe object.');
 let invoice:any=null,subscriptionId:string|undefined,checkout:any=null;
 if(event.type.startsWith('invoice.')){invoice=await stripe('invoices/'+encodeURIComponent(eventObject.id),undefined,event.account);subscriptionId=objectId(invoice.subscription)??objectId(invoice.parent?.subscription_details?.subscription);}
 else if(event.type.startsWith('checkout.')){checkout=await stripe('checkout/sessions/'+encodeURIComponent(eventObject.id),undefined,event.account);if(checkout.status==='expired'){await db.batch([db.prepare("UPDATE rider_subscriptions SET status='incomplete_expired',updated=? WHERE account=? AND checkout=? AND status='pending'").bind(Date.now(),event.account,checkout.id),db.prepare('INSERT OR IGNORE INTO billing_events VALUES(?,?,?)').bind(event.id,event.account,Date.now())]);return;}subscriptionId=objectId(checkout.subscription);}
 else subscriptionId=eventObject.id;
 if(!subscriptionId)return;
 const subscription=await stripe('subscriptions/'+encodeURIComponent(subscriptionId),undefined,event.account),bindingId=subscription.metadata?.eo_binding;
 const binding=await db.prepare('SELECT s.*,c.snapshot,c.price AS stripe_price,c.plan FROM rider_subscriptions s JOIN billing_catalog c ON c.id=s.catalog AND c.tenant=s.tenant WHERE s.id=? AND s.account=? AND s.tenant=?').bind(bindingId??'',event.account,account.tenant).first<any>();
 if(!binding)return;
 if(binding.subscription&&binding.subscription!==subscription.id)throw Error('Subscription does not match rider.');
 if(objectId(subscription.customer)!==binding.stripe_customer||subscription.metadata?.eo_rider!==binding.rider)throw Error('Subscription family or rider mismatch.');
 // Bind only a subscription created through the exact reserved checkout, never arbitrary metadata.
 if(!binding.subscription){if(!binding.checkout)throw Error('Checkout has not been recorded yet.');const verified=checkout??await stripe('checkout/sessions/'+encodeURIComponent(binding.checkout),undefined,event.account);if(verified.id!==binding.checkout||objectId(verified.subscription)!==subscription.id||verified.metadata?.eo_binding!==binding.id||objectId(verified.customer)!==binding.stripe_customer||verified.status!=='complete')throw Error('Checkout is not complete.');}
 const items=subscription.items?.data??[];if(items.length!==1||items[0].quantity!==1)throw Error('Subscription price changed outside EO. Reconcile the rider plan before granting credits.');
 const currentCatalog=await db.prepare('SELECT c.* FROM billing_catalog c JOIN subscription_catalogs m ON m.catalog=c.id WHERE m.binding=? AND c.tenant=? AND c.account=? AND c.price=?').bind(binding.id,binding.tenant,binding.account,objectId(items[0].price)??'').first<any>();if(!currentCatalog)throw Error('Subscription price changed outside EO. Reconcile the rider plan before granting credits.');
 const status=subscription.status,periodEnd=Number(subscription.current_period_end??items[0].current_period_end)*1000;
 if(!['active','trialing','past_due','unpaid','incomplete','incomplete_expired','canceled','paused'].includes(status)||!Number.isFinite(periodEnd))throw Error('Unexpected subscription state.');
 const writes:D1PreparedStatement[]=[db.prepare('INSERT INTO billing_events VALUES(?,?,?)').bind(event.id,event.account,Date.now()),db.prepare('UPDATE rider_subscriptions SET subscription=?,catalog=?,status=?,period_end=?,cancel_at_end=?,next_catalog=CASE WHEN next_catalog=? THEN NULL ELSE next_catalog END,schedule=?,updated=? WHERE id=? AND tenant=?').bind(subscription.id,currentCatalog.id,status,periodEnd,Number(!!subscription.cancel_at_period_end),currentCatalog.id,objectId(subscription.schedule)??null,Date.now(),binding.id,binding.tenant)];
 const usable=!['canceled','paused','incomplete_expired'].includes(status);
 writes.push(db.prepare('UPDATE memberships SET status=?,updated=? WHERE tenant=? AND id=?').bind(usable?'active':'canceled',Date.now(),binding.tenant,binding.id));
 // Only paid, regular billing-cycle invoices grant a fresh immutable allowance period.
 if(event.type==='invoice.paid'&&invoice?.status==='paid'&&invoice.paid===true&&['subscription_create','subscription_cycle'].includes(invoice.billing_reason)){
 const lines=invoice.lines?.data??[];if(invoice.lines?.has_more||lines.length!==1||lines[0].proration||lines[0].quantity!==1||objectId(invoice.customer)!==binding.stripe_customer)throw Error('Invoice does not match the rider plan.');
 const invoiceCatalog=await db.prepare('SELECT c.* FROM billing_catalog c JOIN subscription_catalogs m ON m.catalog=c.id WHERE m.binding=? AND c.tenant=? AND c.account=? AND c.price=?').bind(binding.id,binding.tenant,binding.account,objectId(lines[0].price)??'').first<any>();if(!invoiceCatalog)throw Error('Invoice does not match an authorized rider plan.');
 const start=Number(lines[0].period?.start)*1000,end=Number(lines[0].period?.end)*1000;if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('Invalid invoice period.');
 const key='stripe-invoice:'+invoice.id,prior=await db.prepare('SELECT id FROM benefit_periods WHERE tenant=? AND request_key=?').bind(binding.tenant,key).first();
 if(!prior){const p=purchasablePlan(JSON.parse(invoiceCatalog.snapshot)),a=await db.prepare("SELECT details FROM resources WHERE tenant=? AND kind='academy' LIMIT 1").bind(binding.tenant).first<any>(),zone=a?JSON.parse(a.details).availability?.timezone??'UTC':'UTC',startDate=localDate(start,zone),endDate=localDate(end,zone),period=crypto.randomUUID();
 writes.push(db.prepare('INSERT INTO memberships VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated=excluded.updated WHERE memberships.tenant=excluded.tenant').bind(binding.id,binding.tenant,binding.customer,p.name,usable?'active':'canceled',Date.now()),db.prepare('INSERT INTO benefit_periods VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(period,binding.tenant,binding.id,binding.customer,binding.rider,invoiceCatalog.plan,p.name,'monthly',p.price,'USD',start,end,startDate,endDate,Number(startDate.slice(8)),key));
 for(const b of p.buckets){const id=crypto.randomUUID();writes.push(db.prepare('INSERT INTO benefit_buckets VALUES(?,?,?,?,?)').bind(id,binding.tenant,period,b.label,b.quantity),...b.programs.map(program=>db.prepare('INSERT INTO benefit_offerings VALUES(?,?,?)').bind(binding.tenant,id,program)));}
 writes.push(db.prepare('INSERT INTO audit VALUES(?,?,?,?)').bind(crypto.randomUUID(),binding.tenant,'Stripe confirmed paid rider subscription period: '+p.name,Date.now()));
 }}
 try{await db.batch(writes)}catch(e){if(await db.prepare('SELECT id FROM billing_events WHERE id=? AND account=?').bind(event.id,event.account).first())return;throw e;}
}
