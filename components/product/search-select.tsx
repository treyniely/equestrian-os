'use client';
import {useState} from 'react';

export default function SearchSelect({label,options,value,onChange,required=false,createOption}:{label:string;options:{id:string;name:string}[];value:string;onChange:(id:string)=>void;required?:boolean;createOption?:{id:string;name:string}}){
    const [query,setQuery]=useState('');
    const matches=options.filter(o=>o.id===value||o.name.toLowerCase().includes(query.trim().toLowerCase()));
    return <div>
        <label>Search {label.toLowerCase()}<input type="search" value={query} onChange={event=>setQuery(event.target.value)} /></label>
        <label>{label}<select required={required} value={value} onChange={event=>onChange(event.target.value)}>
            <option value="">{matches.length||createOption?'Choose '+label.toLowerCase():'No matches'}</option>
            {createOption&&<option value={createOption.id}>{createOption.name}</option>}
            {matches.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select></label>
    </div>;
}
