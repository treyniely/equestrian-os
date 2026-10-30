import {z} from 'zod';
export const familyContactSchema=z.object({id:z.string().uuid(),name:z.string().trim().min(1).max(100),relationship:z.string().trim().min(1).max(60),phone:z.string().trim().max(40),email:z.union([z.literal(''),z.string().trim().email().max(200)]),emergency:z.boolean()}).refine(c=>!!c.phone||!!c.email,{message:'Add a phone number or email for each contact.'});
export const familyContactsSchema=z.array(familyContactSchema).max(10).refine(c=>new Set(c.map(x=>x.id)).size===c.length,{message:'Contact IDs must be unique.'});
export type FamilyContact=z.infer<typeof familyContactSchema>;
