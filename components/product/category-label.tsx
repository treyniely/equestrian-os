import type {CSSProperties,ReactNode} from 'react';
import type {OfferingTone} from '../../domain/offering-colors';
import {categoryPalette,categoryColors} from '../../domain/category-colors';
export function categoryStyle(kind:'offering'|'level',value:string,tone?:OfferingTone):CSSProperties{const c=kind==='offering'&&tone?categoryPalette[tone]:categoryColors(kind,value);return {backgroundColor:c.background,color:c.ink,borderColor:c.border};}
export default function CategoryLabel({kind,value,children,tone}:{tone?:OfferingTone;kind:'offering'|'level';value:string;children?:ReactNode}){return <span className="pill category-label" style={categoryStyle(kind,value,tone)}><span className="category-dot" aria-hidden="true"/>{children??value}</span>;}
