import {accessibleBrandColor,brandTheme,contrastRatio} from './branding.ts';
/** Small deterministic palette sampler: ignore transparent/near-white pixels and average coarse buckets. */
export function logoPalette(pixels:ArrayLike<number>){const buckets=new Map<string,{rgb:number[];count:number}>();for(let i=0;i+3<pixels.length;i+=4){const [r,g,b,a]=[pixels[i],pixels[i+1],pixels[i+2],pixels[i+3]];if(a<200||Math.min(r,g,b)>245)continue;const key=[r,g,b].map(c=>Math.floor(c/32)).join(':');const item=buckets.get(key)??{rgb:[0,0,0],count:0};item.rgb[0]+=r;item.rgb[1]+=g;item.rgb[2]+=b;item.count++;buckets.set(key,item)}const result:string[]=[];for(const item of [...buckets.values()].sort((a,b)=>b.count-a.count)){const rgb=item.rgb.map(c=>Math.round(c/item.count)),hex='#'+rgb.map(c=>c.toString(16).padStart(2,'0')).join('').toUpperCase();if(result.every(color=>Math.sqrt(rgb.reduce((sum,c,i)=>sum+(c-parseInt(color.slice(1+i*2,3+i*2),16))**2,0))>65))result.push(hex);if(result.length===4)break}return result}

/** Curate exactly two usable palettes, rather than exposing every sampled pixel color. */
export function logoBrandSchemes(colors:string[]){
 const first=accessibleBrandColor(colors[0]??'#303030');
 const distance=(a:string,b:string)=>Math.sqrt([1,3,5].reduce((n,i)=>n+(parseInt(a.slice(i,i+2),16)-parseInt(b.slice(i,i+2),16))**2,0));
 let second=colors.slice(1).map(accessibleBrandColor).find(c=>distance(c,first)>45);
 if(!second){const light=contrastRatio(first,'#000000')<2;second=accessibleBrandColor('#'+[1,3,5].map(i=>{const c=parseInt(first.slice(i,i+2),16);return Math.round(light?c+(255-c)*.25:c*.65).toString(16).padStart(2,'0')}).join(''))}
 return [first,second].map((color,i)=>({label:i===0?'Signature':'Alternative',...brandTheme(color)}));
}
