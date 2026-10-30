export type Suitability={level?:string;suitableLevels?:string[]};
/** Explicit checklists match labels exactly. Empty means the visible All levels choice. */
export function allowsRiderLevel(kind:string,details:Suitability,level:string){if(Array.isArray(details.suitableLevels))return !details.suitableLevels.length||details.suitableLevels.includes(level);return !(kind==='horse'&&details.level==='Advanced'&&level==='Beginner');}
export function suitabilitySelections(kind:string,details:Suitability){return details.suitableLevels??(kind==='horse'?[details.level??'Beginner']:[]);}
