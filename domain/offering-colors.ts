import {categoryPalette,categoryTone} from './category-colors.ts';
export type OfferingTone=keyof typeof categoryPalette;
export const offeringTones=Object.keys(categoryPalette) as OfferingTone[];
type Offering={id:string;kind:string;details:{template?:string;calendarColor?:string}};
export function isOfferingTone(value:unknown):value is OfferingTone{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(categoryPalette,value);}
export function nextOfferingTone(template:string,used:OfferingTone[]):OfferingTone{const preferred=categoryTone('offering',template),counts=Object.fromEntries(offeringTones.map(t=>[t,used.filter(v=>v===t).length])) as Record<OfferingTone,number>,minimum=Math.min(...Object.values(counts));return counts[preferred]===minimum?preferred:offeringTones.find(t=>counts[t]===minimum)!;}
/** Resolve before filtering. Existing unconfigured offerings get deterministic distinct defaults. */
export function offeringColorMap(resources:Offering[]):Record<string,OfferingTone>{const rows=resources.filter(r=>r.kind==='lesson').slice().sort((a,b)=>a.id.localeCompare(b.id)),out:Record<string,OfferingTone>={},pending:Offering[]=[];
 for(const r of rows)if(isOfferingTone(r.details.calendarColor))out[r.id]=r.details.calendarColor;
 // Give the first offering of each type its familiar hue before distributing duplicate types.
 for(const r of rows.filter(r=>!out[r.id])){const preferred=categoryTone('offering',r.details.template??'custom');if(!Object.values(out).includes(preferred))out[r.id]=preferred;else pending.push(r);}
 for(const r of pending)out[r.id]=nextOfferingTone(r.details.template??'custom',Object.values(out));return out;}
