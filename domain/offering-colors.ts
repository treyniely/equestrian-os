import {categoryTone} from './category-colors.ts';
export const offeringPalette = {
  red: { name: 'Medium red', swatch: '#AA343B', background: '#F5DADF', ink: '#731F2A' },
  scarlet: { name: 'Bright red', swatch: '#F23526', background: '#FFD2CA', ink: '#831A13' },
  orange: { name: 'Orange', swatch: '#F18728', background: '#FFE0BD', ink: '#793504' },
  yellow: { name: 'Yellow', swatch: '#EAC21B', background: '#FFF0A3', ink: '#604A00' },
  amber: { name: 'Brown', swatch: '#86522E', background: '#EBD8C7', ink: '#583219' },
  lime: { name: 'Bright green', swatch: '#72BF2F', background: '#DDF2B8', ink: '#365610' },
  green: { name: 'Deep green', swatch: '#23704B', background: '#C9E7D2', ink: '#184A32' },
  teal: { name: 'Turquoise', swatch: '#05ADA5', background: '#B9EFEB', ink: '#085854' },
  sky: { name: 'Light blue', swatch: '#69C7F1', background: '#D2EFFB', ink: '#18536E' },
  blue: { name: 'Medium blue', swatch: '#3075DF', background: '#CEE0FE', ink: '#173F87' },
  indigo: { name: 'Dark blue', swatch: '#293F83', background: '#CDD4EF', ink: '#233570' },
  violet: { name: 'Purple', swatch: '#8245CC', background: '#E6D3FA', ink: '#502582' },
  pink: { name: 'Light pink', swatch: '#F6A7CB', background: '#FCE0ED', ink: '#7E3659' },
  rose: { name: 'Vibrant pink', swatch: '#DA3787', background: '#FAC7E4', ink: '#7D1B50' },
  slate: { name: 'Gray', swatch: '#828B95', background: '#E2E6EA', ink: '#343E49' },
  black: { name: 'Black', swatch: '#222428', background: '#D0D1D4', ink: '#191A1D' },
} as const;
export type OfferingTone = keyof typeof offeringPalette;
export const offeringTones = Object.keys(offeringPalette) as OfferingTone[];
type Offering={id:string;kind:string;details:{template?:string;calendarColor?:string}};
export function isOfferingTone(value:unknown):value is OfferingTone{return typeof value==='string'&&Object.prototype.hasOwnProperty.call(offeringPalette,value);}
export function nextOfferingTone(template:string,used:OfferingTone[]):OfferingTone{const preferred=categoryTone('offering',template),counts=Object.fromEntries(offeringTones.map(t=>[t,used.filter(v=>v===t).length])) as Record<OfferingTone,number>,minimum=Math.min(...Object.values(counts));return counts[preferred]===minimum?preferred:offeringTones.find(t=>counts[t]===minimum)!;}
/** Resolve before filtering. Existing unconfigured offerings get deterministic distinct defaults. */
export function offeringColorMap(resources:Offering[]):Record<string,OfferingTone>{const rows=resources.filter(r=>r.kind==='lesson').slice().sort((a,b)=>a.id.localeCompare(b.id)),out:Record<string,OfferingTone>={},pending:Offering[]=[];
 for(const r of rows)if(isOfferingTone(r.details.calendarColor))out[r.id]=r.details.calendarColor;
 // Give the first offering of each type its familiar hue before distributing duplicate types.
 for(const r of rows.filter(r=>!out[r.id])){const preferred=categoryTone('offering',r.details.template??'custom');if(!Object.values(out).includes(preferred))out[r.id]=preferred;else pending.push(r);}
 for(const r of pending)out[r.id]=nextOfferingTone(r.details.template??'custom',Object.values(out));return out;}
