import test from 'node:test';import assert from 'node:assert/strict';
import {stripeCustomerUrl} from '../domain/stripe-customer.ts';import {requiredFeature,visibleState,roleGrants,can} from '../domain/permissions.ts';import {fixture} from './helpers.ts';import {applyAction,readWorkspace} from '../server/workspace.ts';import {portalAction,portalState} from '../server/portal.ts';
test('Stripe shortcuts permit only customer dashboard paths and keep test/account context',()=>{
 for(const path of ['/customers/cus_demo','/test/customers/cus_demo','/acct_demo/test/customers/cus_demo','/acct_demo/customers/cus_demo'])assert.equal(stripeCustomerUrl(' https://dashboard.stripe.com'+path+'/ '),'https://dashboard.stripe.com'+path);
 for(const url of ['javascript:alert(1)','https://dashboard.stripe.com.evil.invalid/customers/cus_demo','https://evil.invalid/customers/cus_demo','http://dashboard.stripe.com/customers/cus_demo','https://dashboard.stripe.com/payments/pi_demo','https://dashboard.stripe.com/customers/cus_demo?redirect=bad','https://someone@dashboard.stripe.com/customers/cus_demo','https://dashboard.stripe.com/customers/cus_demo#secret'])assert.throws(()=>stripeCustomerUrl(url));
 assert.equal(stripeCustomerUrl(''),'');
});
test('Stripe customer references require billing management and are redacted from customer-only access',()=>{
 assert.equal(requiredFeature({action:'customerStripe'}),'billing');const grants=roleGrants('instructor');grants.customers={view:true,manage:true};assert.equal(can(grants,requiredFeature({action:'customerStripe'}),true),false);
 const result=visibleState({resources:[],customers:[{stripe_customer_url:'https://dashboard.stripe.com/customers/cus_demo',billing:'current',balance:100}],memberships:[]},grants);assert.equal(result.customers[0].stripe_customer_url,undefined);assert.equal(result.customers[0].balance,0);
});
test('Stripe record shortcuts are tenant scoped, removable, preserved by contact edits and private from family portal',async()=>{
 const {db}=fixture();await applyAction(db,'a',{action:'resource',kind:'academy',name:'Academy'});const user={userId:'family',email:'family@example.invalid'};await portalAction(db,'a',user,{action:'join',name:'Guardian',phone:'',adultConfirmed:true,emailConsent:false,smsConsent:false});const customer=(await portalState(db,'a',user)).customer!;
 const url='https://dashboard.stripe.com/test/customers/cus_demo';await applyAction(db,'a',{action:'customerStripe',customer:customer.id,url});assert.equal((await readWorkspace(db,'a')).customers[0].stripe_customer_url,url);assert.equal('stripe_customer_url' in (await portalState(db,'a',user)).customer!,false);
 await assert.rejects(applyAction(db,'b',{action:'customerStripe',customer:customer.id,url}),/not found/);await assert.rejects(applyAction(db,'a',{action:'customerStripe',customer:customer.id,url:'https://evil.invalid'}));
 await applyAction(db,'a',{action:'customer',id:customer.id,name:'Guardian',email:user.email,phone:'',stage:'active',billing:'none',balance:0,notes:'',emailConsent:false,smsConsent:false,stripe_customer_url:''});assert.equal((await readWorkspace(db,'a')).customers[0].stripe_customer_url,url);
 await applyAction(db,'a',{action:'customerStripe',customer:customer.id,url:''});assert.equal((await readWorkspace(db,'a')).customers[0].stripe_customer_url,'');
});
