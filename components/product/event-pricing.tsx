'use client';

import { useState } from 'react';
import type { EventClasses } from '../../domain/event-classes';
import OfferingPaymentOptions from './offering-payment-options';

const cents = (value: string) => Math.round(Number(value) * 100);

export default function EventPricing({ initial, access, price }: {
  initial?: EventClasses; access?: string; price: number;
}) {
  const [classPricing, setClassPricing] = useState(!!initial);
  const [rows, setRows] = useState(() => initial?.classes.map(entry => ({
    id: crypto.randomUUID(), name: entry.name, price: String(entry.price / 100),
  })) ?? [{ id: crypto.randomUUID(), name: '', price: '' }]);
  const [hasPass, setHasPass] = useState(initial?.passPrice != null);
  const [pass, setPass] = useState(initial?.passPrice == null ? '' : String(initial.passPrice / 100));
  const update = (id: string, patch: { name?: string; price?: string }) =>
    setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row));

  return <>
    <label>Event pricing<select value={classPricing ? 'classes' : 'single'} onChange={event => setClassPricing(event.target.value === 'classes')}>
      <option value="single">One price for the event</option>
      <option value="classes">Price each class separately</option>
    </select></label>
    {!classPricing ? <OfferingPaymentOptions initialAccess={access} initialPrice={price} allowFree /> : <>
      <fieldset className="plan-allowance-editor event-unlimited-pass">
        <legend>Unlimited pass</legend>
      <label className="checkbox"><input type="checkbox" checked={hasPass} onChange={event => setHasPass(event.target.checked)} /><strong>Offer an unlimited pass</strong></label>
      {hasPass && <><label>Unlimited pass price · USD<span className="event-price-input"><span aria-hidden="true">$</span><input required type="number" min="0.01" max="100000" step="0.01" value={pass} onChange={event => setPass(event.target.value)} /></span></label><p>Individual entry total: ${(rows.reduce((sum,row)=>sum+cents(row.price),0)/100).toFixed(2)}</p></>}
        <p>Give riders access to every class for one price. You can still set individual entry prices below.</p>
      </fieldset>
      <fieldset className="plan-allowance-editor">
      <legend>Classes</legend>
      <p>List the classes riders can enter. Set a price for each class.</p>
      <input type="hidden" name="access" value="paid" />
      <input type="hidden" name="price" value="0" />
      <input type="hidden" name="eventClasses" value={JSON.stringify({
        classes: rows.map(row => ({ name: row.name, price: cents(row.price) })),
        passPrice: hasPass ? cents(pass) : null,
      })} />
      {rows.map((row, index) => <div key={row.id} className="plan-allowance-editor">
        <div className="form-grid">
          <label>Class {index + 1} name<input required maxLength={100} value={row.name} placeholder="Showmanship" onChange={event => update(row.id, { name: event.target.value })} /></label>
          <label>Entry price · USD<span className="event-price-input"><span aria-hidden="true">$</span><input type="number" min="0.01" max="100000" step="0.01" required value={row.price} onChange={event => update(row.id, { price: event.target.value })} /></span></label>
        </div>
        {rows.length > 1 && <button type="button" className="secondary event-remove-class" onClick={() => setRows(current => current.filter(entry => entry.id !== row.id))}>Remove class</button>}
      </div>)}
      <button type="button" className="secondary" disabled={rows.length >= 100} onClick={() => setRows(current => [...current, {id:crypto.randomUUID(), name:'', price:''}])}>Add class</button>
      <p>Families can preview prices and selections. Online event checkout is pending.</p>
    </fieldset></>}
  </>;
}
