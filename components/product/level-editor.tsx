'use client';

import {useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';
import {categoryColors,categoryPalette,levelIcons,type LevelAppearance} from '../../domain/category-colors';
import type {Resource,Save} from './types';
import CategoryLabel,{LevelIcon} from './category-label';

const colors=Object.keys(categoryPalette) as (keyof typeof categoryPalette)[];
const label=(value:string)=>value.charAt(0).toUpperCase()+value.slice(1);
import Dialog from './dialog';

export default function LevelEditor({level,save,busy,close}:{level?:Resource;save:Save;busy:boolean;close:()=>void}){
    const [name,setName]=useState(level?.name??'');
    const [appearance,setAppearance]=useState<LevelAppearance>(level?.details.levelAppearance??{});
    return <Dialog title={level?'Edit level appearance':'Add rider level'} onClose={close}>
        <form onSubmit={async event=>{
            event.preventDefault();
            if(await save({action:'resource',kind:'level',id:level?.id,name,levelAppearance:appearance}))close();
        }}>
            <label>Level name<input required readOnly={!!level} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
            <fieldset className="offering-color-picker">
                <legend>Badge color</legend>
                <div className="offering-color-options">
                    {([undefined,...colors]).map(tone=>(
                        <button key={tone??'auto'} type="button" aria-pressed={appearance.tone===tone} onClick={()=>setAppearance({...appearance,tone})}>
                            <span className="offering-swatch" style={{backgroundColor:(tone?categoryPalette[tone]:categoryColors('level',name)).ink}} aria-hidden="true"/>
                            <span>{tone?label(tone):'Automatic'}</span>
                            {appearance.tone===tone&&<Check size={14} aria-hidden="true"/>}
                        </button>
                    ))}
                </div>
                <details className="level-icon-picker">
                    <summary>Choose an icon <span className="level-icon-current"><LevelIcon icon={appearance.icon} size={16}/>{label(appearance.icon??'dot')}<ChevronDown size={15} aria-hidden="true"/></span></summary>
                    <div className="offering-color-options" role="group" aria-label="Badge icon">
                        {levelIcons.map(icon=>(
                            <button key={icon} type="button" aria-pressed={(appearance.icon??'dot')===icon} onClick={()=>setAppearance({...appearance,icon})}>
                                <LevelIcon icon={icon} size={17}/><span>{label(icon)}</span>
                                {(appearance.icon??'dot')===icon&&<Check size={14} aria-hidden="true"/>}
                            </button>
                        ))}
                    </div>
                </details>
                <div className="offering-color-preview" aria-live="polite">
                    <small>Badge preview</small><CategoryLabel kind="level" value={name.trim()||'Rider level'} appearance={appearance}/>
                </div>
            </fieldset>
            <button className="primary submit" disabled={busy}>{busy?'Saving…':'Save level'}</button>
        </form>
    </Dialog>;
}
