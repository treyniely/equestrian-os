'use client';
import {useId,useState} from 'react';
type Access='paid'|'membership'|'free';
const options:{value:Access;title:string;description:string}[]=[
 {value:'paid',title:'Customers pay for each booking',description:'Set a price for one lesson or event. You can also include it in a plan or package later.'},
 {value:'membership',title:'Customers need a plan or package',description:'Customers book using the sessions included in their plan. You’ll set the plan’s price and number of sessions separately.'},
 {value:'free',title:'Free for everyone',description:'Customers can book without paying or having a plan.'},
];
export default function OfferingPaymentOptions({initialAccess='paid',initialPrice=65}:{initialAccess?:string;initialPrice?:number}){
 const [access,setAccess]=useState<Access>(options.some(o=>o.value===initialAccess)?initialAccess as Access:'paid'),[price,setPrice]=useState(String(initialPrice)),id=useId();
 return <fieldset className="offering-payment-options"><legend>How will customers book this?</legend><p>Choose the option that matches how you sell this lesson or activity.</p><div className="offering-payment-cards">{options.map(option=><label key={option.value} className={'offering-payment-choice'+(access===option.value?' selected':'')}><input type="radio" name="access" required value={option.value} checked={access===option.value} onChange={()=>setAccess(option.value)}/><span><strong>{option.title}</strong><small>{option.description}</small></span></label>)}</div>{access==='paid'?<label className="offering-single-price" htmlFor={id}>Price for one booking · USD<input id={id} name="price" type="number" required min={0} max={100000} step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label>:<><input name="price" type="hidden" value="0"/><p className="offering-payment-next" role="status">{access==='membership'?'Next: save this offering, then add it to a plan or package in the section below. Set the total plan price there.':'There’s no price to set for this offering.'}</p></>}</fieldset>
}
