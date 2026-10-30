'use client';
import {useState} from 'react';
import {Phone,MessageSquare,Mail,Copy,Check,UserRound} from 'lucide-react';
import type {Customer} from '../../domain/programs';
import Dialog from './dialog';
type Contact={id:string;name:string;email:string;phone:string;relationship:string;primary?:boolean;emergency?:boolean};
function GuardianContact({person}:{person:Contact}){
 const [status,setStatus]=useState(''),[copied,setCopied]=useState(false),[fallback,setFallback]=useState(false);
 const email=person.email.trim(),phone=person.phone.trim(),dial=phone.replace(/[^+\d]/g,'');
 const validPhone=/^\+?\d{6,15}$/.test(dial),validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 async function copyEmail(){try{await navigator.clipboard.writeText(email);setCopied(true);setFallback(false);setStatus('Email address copied for '+person.name+'.')}catch{setCopied(false);setFallback(true);setStatus('Copy unavailable. Select the email address below and copy it.')}}
 return <article className="guardian-contact-card" aria-label={person.name+' contact details'}><div className="parent-contact-header"><span className="parent-contact-avatar" aria-hidden="true"><UserRound size={21}/></span><div><span className="parent-contact-label">{person.primary?'Primary parent / guardian':person.relationship}</span><p className="parent-contact-name">{person.name}</p>{person.emergency&&<span className="pill">Emergency contact</span>}</div></div><div className="guardian-contact-methods">
  <section className="parent-contact-section" aria-label={'Phone for '+person.name}><span>Phone</span><strong>{phone||'No phone number added'}</strong>{validPhone&&<div className="parent-contact-actions"><a className="secondary" href={'tel:'+dial} aria-label={'Call '+person.name}><Phone size={16}/>Call</a><a className="secondary" href={'sms:'+dial} aria-label={'Text '+person.name}><MessageSquare size={16}/>Text</a></div>}</section>
  <section className="parent-contact-section" aria-label={'Email for '+person.name}><span>Email</span><strong>{email||'No email address added'}</strong>{validEmail&&<div className="parent-contact-actions"><a className="secondary" href={'mailto:'+encodeURIComponent(email)} aria-label={'Email '+person.name}><Mail size={16}/>Email</a><button type="button" className="secondary" onClick={copyEmail} aria-label={'Copy email for '+person.name}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy email'}</button></div>}{fallback&&<label>Email address for {person.name}<input readOnly value={email} autoFocus onFocus={e=>e.currentTarget.select()}/></label>}<p className="parent-contact-status" role="status">{status}</p></section>
 </div></article>
}
export default function ParentContact({customer,onClose}:{customer:Customer;onClose:()=>void}){
 const contacts:Contact[]=[{id:'primary',name:customer.name,email:customer.email,phone:customer.phone,relationship:'Primary parent / guardian',primary:true},...(customer.emergency_contacts??[])];
 return <Dialog title="Contact parents / guardians" onClose={onClose}><div className="parent-contact"><div className="guardian-contact-list">{contacts.map(person=><GuardianContact key={person.id} person={person}/>)}</div><p className="parent-contact-note">Each person’s phone and email stay with their name. Call, Text and Email open your device’s apps. Use these details for individual lesson or account questions. Marketing messages use the family’s saved communication preferences.</p></div></Dialog>
}
