import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.ts';
import {roleGrants} from '../domain/permissions.ts';
import {readServiceSetup,saveServiceSetup,setupIntentSchema} from '../server/service-setup.ts';

test('setup intent never activates providers and is scoped to academy and feature permission',async()=>{
    const {db}=fixture();const owner=roleGrants('owner');
    await saveServiceSetup(db,'a',owner,{service:'payroll',reviewed:true,payrollSource:'existing',payFrequency:'biweekly'});
    const a=await readServiceSetup(db,'a',owner,{}),b=await readServiceSetup(db,'b',owner,{});
    assert.equal(a.find(item=>item.id==='payroll')?.intent?.payrollSource,'existing');
    assert.equal(b.find(item=>item.id==='payroll')?.intent,null);
    assert.ok(a.every(item=>!item.configured&&!item.connected));
    await assert.rejects(readServiceSetup(db,'a',roleGrants('intern'),{}),/access required/);
    await assert.rejects(saveServiceSetup(db,'a',roleGrants('manager'),{service:'payroll',reviewed:true}),/permission/);
    const limited=roleGrants('intern');limited.communications={view:true,manage:false};
    const visible=await readServiceSetup(db,'a',limited,{STRIPE_SECRET_KEY:'never-return-this'});
    assert.deepEqual(visible.map(item=>item.id),['messaging']);
    assert.equal(visible[0].manage,false);assert.ok(!JSON.stringify(visible).includes('never-return-this'));
});
test('sensitive fields and cross-service preferences are rejected',()=>{
    assert.equal(setupIntentSchema.safeParse({service:'payroll',reviewed:true,bankAccount:'secret'}).success,false);
    assert.equal(setupIntentSchema.safeParse({service:'video',reviewed:true,payrollSource:'new'}).success,false);
    assert.equal(setupIntentSchema.safeParse({service:'payroll',reviewed:true,notifyFamilies:true}).success,false);
});
test('payment configuration and account linkage are independent statuses',async()=>{
    const {db,sql}=fixture();
    sql.exec("INSERT INTO billing_accounts VALUES('a','acct_test',0,0)");
    const env={STRIPE_BILLING_ENABLED:'true',STRIPE_SECRET_KEY:'secret',STRIPE_CONNECT_CLIENT_ID:'client',STRIPE_WEBHOOK_SECRET:'webhook'};
    const [payments]=await readServiceSetup(db,'a',roleGrants('owner'),env);
    assert.equal(payments.configured,true);assert.equal(payments.connected,true);assert.equal(payments.live,false);
    assert.ok(!JSON.stringify(payments).includes('secret'));
    const unconfigured=(await readServiceSetup(db,'a',roleGrants('owner'),{}))[0];
    assert.equal(unconfigured.configured,false);assert.equal(unconfigured.connected,true);
});
