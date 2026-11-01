import type {CSSProperties,ReactNode} from 'react';
import {categoryColors} from '../../domain/category-colors';
export function categoryStyle(kind:'offering'|'level',value:string):CSSProperties{const c=categoryColors(kind,value);return {backgroundColor:c.background,color:c.ink,borderColor:c.border};}
export default function CategoryLabel({kind,value,children}:{kind:'offering'|'level';value:string;children?:ReactNode}){return <span className="pill category-label" style={categoryStyle(kind,value)}><span className="category-dot" aria-hidden="true"/>{children??value}</span>;}
