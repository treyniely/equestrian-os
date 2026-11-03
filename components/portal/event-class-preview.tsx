'use client';

import { useState } from 'react';
import type { EventClasses } from '../../domain/event-classes';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function EventClassPreview({ pricing }: { pricing: EventClasses }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [usePass, setUsePass] = useState(false);
  const total = usePass ? pricing.passPrice ?? 0 : pricing.classes
    .filter(entry => selected.includes(entry.name))
    .reduce((sum, entry) => sum + entry.price, 0);
  const savings = pricing.classes.reduce((sum, entry) => sum + entry.price, 0) - (pricing.passPrice ?? 0);

  return <details className="portal-event-classes">
    <summary>See classes &amp; prices</summary>
    <fieldset>
      <legend>Preview your entries</legend>
      {pricing.passPrice !== null && <label className="checkbox">
        <input type="checkbox" checked={usePass} onChange={event => setUsePass(event.target.checked)} />
        <span>Unlimited pass · {usd.format(pricing.passPrice / 100)} <small>Save {usd.format(savings / 100)} on all {pricing.classes.length} classes</small></span>
      </label>}
      {pricing.classes.map(entry => <label className="checkbox" key={entry.name}>
        <input type="checkbox" checked={usePass || selected.includes(entry.name)} disabled={usePass} onChange={event => {
          setSelected(current => event.target.checked ? [...current, entry.name] : current.filter(name => name !== entry.name));
        }} />
        <span>{entry.name} · {usd.format(entry.price / 100)}</span>
      </label>)}
      <p aria-live="polite"><strong>Estimated total {usd.format(total / 100)}</strong></p>
      <small>Contact your academy to enter. This preview does not reserve spots or collect payment.</small>
    </fieldset>
  </details>;
}
