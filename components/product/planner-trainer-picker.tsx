'use client';
import {Check} from 'lucide-react';import type {Resource} from './types';
export default function PlannerTrainerPicker({trainers,selected,onSelect}:{trainers:Resource[];selected:string;onSelect:(trainer:Resource)=>void}){
 return <div className="planner-trainer-grid planner-select-cards">{trainers.map(t=><button type="button" key={t.id} aria-label={'Plan lessons for '+t.name} aria-pressed={selected===t.id} onClick={()=>onSelect(t)}><span>{t.details.photoId?<img src={'/api/photos?id='+t.details.photoId} alt=""/>:t.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</span><strong>{t.name}</strong>{selected===t.id&&<Check size={16} aria-hidden="true"/>}</button>)}{!trainers.length&&<p className="planner-setup-help">Add a trainer in Trainers before planning their lessons.</p>}</div>
}
