import type {SVGProps} from 'react';
/** Horse profile, drawn on the same 24px outline grid as the navigation icons. */
export default function HorseIcon({size=24,...props}:SVGProps<SVGSVGElement>&{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M8 21c0-3 1-5 3-7l-3 2-4-2v-3l5-5V2l4 4c5 0 7 6 7 15H8Z"/><path d="M13 6c1 3 3 5 4 6"/><path d="M10 10h.01"/></svg>;
}
