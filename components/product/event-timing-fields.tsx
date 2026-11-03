'use client';

import { useState } from 'react';

export default function EventTimingFields({ zone }: { zone: string }) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [allDay, setAllDay] = useState(false);

  return <fieldset className="plan-allowance-editor">
    <legend>When is it?</legend>
    <input type="hidden" name="eventRequestKey" value={requestKey} />
    <p>Times use {zone}. Add arrival instructions in the description.</p>
    <label>Event date<input type="date" name="eventDate" required /></label>
    <label className="checkbox">
      <input type="checkbox" name="eventAllDay" checked={allDay} onChange={event => setAllDay(event.target.checked)} />
      All-day event
    </label>
    {!allDay && <div className="form-grid">
      <label>Start time<input type="time" name="eventStart" required /></label>
      <label>End time<input type="time" name="eventEnd" required /></label>
    </div>}
  </fieldset>;
}
