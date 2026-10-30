'use client';
import {useRef,useState} from 'react';
import {Phone,MessageSquare,Mail,Copy,Check} from 'lucide-react';
import type {Customer} from '../../domain/programs';
import Dialog from './dialog';

export default function ParentContact({customer,onClose}:{customer:Customer;onClose:()=>void}){
 const [status,setStatus]=useState(''),[copied,setCopied]=useState(false),[fallback,setFallback]=useState(false);
 const emailInput=useRef<HTMLInputElement>(null);
 const email=customer.email.trim(),phone=customer.phone.trim(),dial=phone.replace(/[^+\d]/g,'');
 const validPhone=/^\+?\d{6,15}$/.test(dial),validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 async function copyEmail(){try{await navigator.clipboard.writeText(email);setCopied(true);setFallback(false);setStatus('Email address copied.')}catch{setCopied(false);setFallback(true);setStatus('Copy unavailable. Select the email address below and copy it.')}}
 return <Dialog title="Contact parent / guardian" onClose={onClose}><div className="parent-contact">
  <p className="parent-contact-name">{customer.name}</p>
  <section className="parent-contact-section" aria-label="Parent phone"><span>Phone</span><strong>{phone||'No phone number added'}</strong>{validPhone&&<div className="parent-contact-actions"><a className="secondary" href={'tel:'+dial}><Phone size={16}/>Call</a><a className="secondary" href={'sms:'+dial}><MessageSquare size={16}/>Text</a></div>}</section>
  <section className="parent-contact-section" aria-label="Parent email"><span>Email</span><strong>{email||'No email address added'}</strong>{validEmail&&<div className="parent-contact-actions"><a className="secondary" href={'mailto:'+encodeURIComponent(email)}><Mail size={16}/>Email</a><button type="button" className="secondary" onClick={copyEmail}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy email'}</button></div>}{fallback&&<label>Email address<input ref={emailInput} readOnly value={email} autoFocus onFocus={e=>e.currentTarget.select()}/></label>}<p className="parent-contact-status" role="status">{status}</p></section>
  <p className="parent-contact-note">Call, Text and Email open your device’s apps. Use these details for individual lesson or account questions. Marketing messages use the family’s saved communication preferences.</p>
 </div></Dialog>
}
