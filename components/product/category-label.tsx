'use client';
import {createContext,useContext} from 'react';
import {Shield,Medal,Star,Rainbow} from 'lucide-react';
import type {CSSProperties,ReactNode} from 'react';
import {offeringPalette,type OfferingTone} from '../../domain/offering-colors';
import {categoryColors,categoryPalette,billingLabels,billingNeedsAttention,type LevelAppearance,type LevelLabel} from '../../domain/category-colors';
export function categoryStyle(kind: 'offering' | 'level', value: string, tone?: OfferingTone): CSSProperties {
  if (kind === 'offering' && tone) {
    const color = offeringPalette[tone];
    return { backgroundColor: color.background, color: color.ink, borderColor: color.swatch };
  }
  const color = categoryColors(kind, value);
  return { backgroundColor: color.background, color: color.ink, borderColor: color.border };
}
export const LevelLabels = createContext<LevelLabel[]>([]);
const icons={shield:Shield,medal:Medal,star:Star,rainbow:Rainbow};
export function LevelIcon({icon='dot',size=12}:{icon?:LevelAppearance['icon'];size?:number}){
  const Icon=icon==='dot'?undefined:icons[icon];
  return Icon?<Icon size={size} aria-hidden="true"/>:<span className="category-dot" aria-hidden="true"/>;
}
export default function CategoryLabel({kind,value,children,tone,appearance}:{tone?:OfferingTone;kind:'offering'|'level';value:string;children?:ReactNode;appearance?:LevelAppearance}){
  const levels=useContext(LevelLabels);
  const look=kind==='level'?(appearance??levels.find(l=>l.name===value)?.details.levelAppearance):undefined;
  const color=look?.tone?categoryPalette[look.tone]:undefined;
  const style=color?{backgroundColor:color.background,color:color.ink,borderColor:color.border}:categoryStyle(kind,value,tone);
  return <span className="pill category-label" style={style}><LevelIcon icon={look?.icon}/>{children??value}</span>;
}
export function StatusLabel({status,billing=false}:{status:string;billing?:boolean}){
  const color=categoryPalette[billing?(status==='current'?'green':billingNeedsAttention(status)?'red':'slate'):status==='active'?'green':'red'];
  return <span className="pill category-label" style={{backgroundColor:color.background,color:color.ink,borderColor:color.border}}><span className="category-dot" aria-hidden="true"/>{billing?(billingLabels[status]??billingLabels.none):status==='active'?'Active':'Inactive'}</span>;
}
