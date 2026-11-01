import {z} from 'zod';
const text=(max:number)=>z.string().trim().max(max).optional().default('');
function web(value:string){if(!value)return '';try{const u=new URL(/^https?:\/\//i.test(value)?value:'https://'+value);if(u.protocol!=='https:'||u.username||u.password)return null;return u.href}catch{return null}}
export function groupMeInvite(value:string){if(!value.trim())return '';try{const u=new URL(value.trim());if(u.protocol!=='https:'||!['groupme.com','www.groupme.com','web.groupme.com'].includes(u.hostname)||u.username||u.password||u.port||!/^\/join_group\/\d+\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)||u.search||u.hash)return null;return u.href}catch{return null}}
export const academyContactSchema=z.object({
 address1:text(150),address2:text(150),city:text(100),region:text(100),postalCode:text(30),country:text(80),phone:text(40),
 email:text(254).refine(v=>!v||z.string().email().safeParse(v).success,'Enter a valid academy email.'),
 website:text(500).transform(web).refine((v):v is string=>v!==null,'Use an HTTPS website address.'),
 groupMeUrl:text(500).transform(groupMeInvite).refine((v):v is string=>v!==null,'Paste a GroupMe group sharing link: https://groupme.com/join_group/…'),
 groupMeEnabled:z.boolean().optional().default(false),
}).refine(v=>!v.groupMeEnabled||!!v.groupMeUrl,'Add a GroupMe sharing link before showing it in the portal.');
export type AcademyContact=z.infer<typeof academyContactSchema>;
export function readAcademyContact(raw:unknown):AcademyContact{const parsed=academyContactSchema.safeParse(raw??{});return parsed.success?parsed.data:academyContactSchema.parse({})}
export function addressLines(c:AcademyContact){return [c.address1,c.address2,[c.city,c.region,c.postalCode].filter(Boolean).join(', '),c.country].filter(Boolean)}
export function academyPhoneLink(phone:string){const digits=phone.replace(/\D/g,'');return digits?(phone.trim().startsWith('+')?'+':'')+digits:''}
