export const defaultBrandColor='#244B3B';
export function normalizeBrandColor(value:unknown):string|null{if(typeof value!=='string'||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()))return null;const hex=value.trim().slice(1);return '#'+(hex.length===3?hex.split('').map(c=>c+c).join(''):hex).toUpperCase()}
function rgb(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))}
function luminance(hex:string){const [r,g,b]=rgb(hex).map(c=>{const v=c/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b}
export function contrastRatio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function mix(a:string,b:string,amount:number){const target=rgb(b);return '#'+rgb(a).map((c,i)=>Math.round(c*(1-amount)+target[i]*amount).toString(16).padStart(2,'0')).join('').toUpperCase()}
function foreground(background:string){return contrastRatio(background,'#FFFFFF')>=contrastRatio(background,'#000000')?'#FFFFFF':'#000000'}
/** Preserve the chosen button color; derive readable text and accents rather than accepting arbitrary CSS. */
export function brandTheme(value?:unknown){const primary=normalizeBrandColor(value)??defaultBrandColor,hover=mix(primary,'#000000',.12),tint=mix(primary,'#FFFFFF',.91);let accent=primary;for(let i=0;Math.min(contrastRatio(accent,'#FFFFFF'),contrastRatio(accent,'#F8F8F4'),contrastRatio(accent,tint))<4.5&&i<20;i++)accent=mix(accent,'#000000',.12);return {primary,onPrimary:foreground(primary),hover,onHover:foreground(hover),accent,tint}}
export function brandVariables(value?:unknown){const t=brandTheme(value);return {'--portal-brand':t.primary,'--portal-on-brand':t.onPrimary,'--portal-brand-hover':t.hover,'--portal-on-brand-hover':t.onHover,'--portal-accent':t.accent,'--portal-brand-tint':t.tint}}
