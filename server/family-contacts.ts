import {z} from 'zod';import {familyContactsSchema} from '../domain/family-contacts.ts';
export async function saveFamilyContacts(db:D1Database,tenant:string,customer:string,raw:Record<string,unknown>){const contacts=familyContactsSchema.parse(raw.contacts),revision=z.number().int().min(0).parse(raw.revision);
 const changed=await db.prepare('UPDATE customers SET emergency_contacts=?,contacts_revision=contacts_revision+1 WHERE tenant=? AND id=? AND contacts_revision=? RETURNING id').bind(JSON.stringify(contacts),tenant,customer,revision).first();
 if(!changed)throw Error('Contacts changed or this family is unavailable. Refresh the page before editing again.');
 await db.prepare('INSERT INTO audit(id,tenant,action,created) VALUES(?,?,?,?)').bind(crypto.randomUUID(),tenant,'Updated family backup contacts',Date.now()).run();}
