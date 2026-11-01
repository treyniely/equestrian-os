// Shared visual categories only. Colors never determine suitability, rank or booking access.
export const categoryPalette={
 blue:{background:'#eff6ff',ink:'#1e40af',border:'#bfdbfe'},
 violet:{background:'#f5f3ff',ink:'#5b21b6',border:'#ddd6fe'},
 teal:{background:'#f0fdfa',ink:'#115e59',border:'#99f6e4'},
 green:{background:'#f0fdf4',ink:'#166534',border:'#bbf7d0'},
 rose:{background:'#fff1f2',ink:'#9f1239',border:'#fecdd3'},
 amber:{background:'#fffbeb',ink:'#92400e',border:'#fde68a'},
 indigo:{background:'#eef2ff',ink:'#3730a3',border:'#c7d2fe'},
 slate:{background:'#f1f5f9',ink:'#334155',border:'#cbd5e1'},
 red:{background:'#fef2f2',ink:'#991b1b',border:'#fecaca'},
 orange:{background:'#fff7ed',ink:'#9a3412',border:'#fed7aa'},
 yellow:{background:'#fefce8',ink:'#854d0e',border:'#fef08a'},
} as const;
type Tone=keyof typeof categoryPalette;
const offerings:Record<string,Tone>={private:'blue',group:'violet',class:'teal',experience:'green',party:'rose',camp:'amber',event:'indigo',custom:'slate',legacy:'slate'};
const levels:Record<string,Tone>={beginner:'green',intermediate:'amber',advanced:'violet',red:'red',yellow:'yellow',orange:'orange',green:'green',blue:'blue',purple:'violet',rainbow:'rose',white:'slate',black:'slate','all rider levels':'slate','all levels':'slate'};
export function categoryTone(kind:'offering'|'level',value:string):Tone{const name=value.trim().toLowerCase().replace(/\s+/g,' ');if(kind==='offering')return offerings[name]??'slate';const short=name.replace(/\s+(group|level)$/,'');if(levels[short])return levels[short];if(/\bred\b/.test(short)&&/\byellow\b/.test(short))return 'orange';const tones:Tone[]=['blue','teal','rose','indigo','orange','violet'];let hash=0;for(const c of name)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return tones[hash%tones.length];}
export function categoryColors(kind:'offering'|'level',value:string){return categoryPalette[categoryTone(kind,value)];}
