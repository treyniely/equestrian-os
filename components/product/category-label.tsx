import type {CSSProperties,ReactNode} from 'react';
import {offeringPalette,type OfferingTone} from '../../domain/offering-colors';
import {categoryColors} from '../../domain/category-colors';
export function categoryStyle(kind: 'offering' | 'level', value: string, tone?: OfferingTone): CSSProperties {
  if (kind === 'offering' && tone) {
    const color = offeringPalette[tone];
    return { backgroundColor: color.background, color: color.ink, borderColor: color.swatch };
  }
  const color = categoryColors(kind, value);
  return { backgroundColor: color.background, color: color.ink, borderColor: color.border };
}
export default function CategoryLabel({kind,value,children,tone}:{tone?:OfferingTone;kind:'offering'|'level';value:string;children?:ReactNode}){return <span className="pill category-label" style={categoryStyle(kind,value,tone)}><span className="category-dot" aria-hidden="true"/>{children??value}</span>;}
