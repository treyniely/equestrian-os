import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers.ts';
import {defaultOperationalPreferences,operationalConsentEntries} from '../domain/communication-consent.ts';
import {readOperationalConsent,saveOperationalConsent} from '../server/communication-consent.ts';
const user={userId:'parent-a'};
function seed(sql:ReturnType<typeof fixture>['sql'],tenant='a',customer='customer-a',userId='parent-a'){
 sql.prepare("INSERT INTO customers(id,tenant,name,email,phone,stage,billing,balance,notes,email_consent,sms_consent,adult_confirmed) VALUES(?,?,?,'example@example.invalid','5550100','active','current',0,'',1,1,1)").run(customer,tenant,'Fictional Parent');
 sql.prepare('INSERT INTO family_accounts VALUES(?,?,?,?,?)').run('link-'+tenant+'-'+userId,tenant,userId,customer,Date.now());
}
test('operational preferences default off despite existing marketing opt-ins',async()=>{
 const {db,sql}=fixture();seed(sql);
 assert.deepEqual((await readOperationalConsent(db,'a',user)).preferences,defaultOperationalPreferences);
});
test('lesson and schedule consent persist independently and record exact purpose/channel/wording',async()=>{
 const {db,sql}=fixture();seed(sql);
 const preferences={lessonEmail:true,lessonSms:false,scheduleEmail:false,scheduleSms:true};
 await saveOperationalConsent(db,'a',user,preferences);
 assert.deepEqual((await readOperationalConsent(db,'a',user)).preferences,preferences);
 const records=sql.prepare("SELECT details FROM resources WHERE tenant='a' AND kind='communication-consent-event'").all() as {details:string}[];
 assert.equal(records.length,4);
 const events=records.map(r=>JSON.parse(r.details));
 assert.equal(events.find(e=>e.key==='scheduleSms').purpose,'schedule');
 assert.equal(events.find(e=>e.key==='scheduleSms').channel,'sms');
 assert.equal(events.find(e=>e.key==='scheduleSms').granted,true);
 assert.ok(events.every(e=>e.barn==='a'&&e.customer==='customer-a'&&e.source==='customer-portal'&&e.timestamp>0&&e.wording));
 assert.deepEqual({...sql.prepare("SELECT email_consent,sms_consent FROM customers WHERE id='customer-a'").get()},{email_consent:1,sms_consent:1});
 await saveOperationalConsent(db,'a',user,defaultOperationalPreferences);
 assert.deepEqual((await readOperationalConsent(db,'a',user)).preferences,defaultOperationalPreferences);
 assert.equal(sql.prepare("SELECT count(*) AS n FROM resources WHERE kind='communication-consent'").get()?.n,1);
 assert.equal(sql.prepare("SELECT count(*) AS n FROM resources WHERE kind='communication-consent-event'").get()?.n,8);
});
test('server derives family and tenant and rejects browser-supplied customer or actor fields',async()=>{
 const {db,sql}=fixture();seed(sql);seed(sql,'b','customer-b','parent-b');
 await assert.rejects(readOperationalConsent(db,'b',user),/access required/);
 await assert.rejects(saveOperationalConsent(db,'b',user,defaultOperationalPreferences),/access required/);
 await assert.rejects(saveOperationalConsent(db,'a',user,{...defaultOperationalPreferences,customer:'customer-b'}));
 await saveOperationalConsent(db,'a',user,{...defaultOperationalPreferences,lessonEmail:true});
 assert.deepEqual((await readOperationalConsent(db,'b',{userId:'parent-b'})).preferences,defaultOperationalPreferences);
});
test('opt-in requires an adult and relevant contact details, while opting out stays available',async()=>{
 const {db,sql}=fixture();seed(sql);
 sql.prepare("UPDATE customers SET adult_confirmed=0 WHERE id='customer-a'").run();
 await assert.rejects(saveOperationalConsent(db,'a',user,{...defaultOperationalPreferences,lessonSms:true}),/adult account holder/);
 await saveOperationalConsent(db,'a',user,defaultOperationalPreferences);
 sql.prepare("UPDATE customers SET adult_confirmed=1,phone='' WHERE id='customer-a'").run();
 await assert.rejects(saveOperationalConsent(db,'a',user,{...defaultOperationalPreferences,scheduleSms:true}),/phone number/);
 sql.prepare("UPDATE customers SET email='' WHERE id='customer-a'").run();
 await assert.rejects(saveOperationalConsent(db,'a',user,{...defaultOperationalPreferences,scheduleEmail:true}),/email address/);
 assert.equal(operationalConsentEntries(defaultOperationalPreferences).length,4);
});
