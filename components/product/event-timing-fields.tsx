'use client';

import { useState } from 'react';

export default function EventTimingFields({ zone, fixedMode, defaultStart, defaultEnd }: { zone: string; fixedMode?: 'all-day' | 'timed'; defaultStart?: string; defaultEnd?: string }) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [allDay, setAllDay] = useState(fixedMode === 'all-day');

  return <fieldset className="plan-allowance-editor">
    <legend>When is it?</legend>
    <input type="hidden" name="eventRequestKey" value={requestKey} />
    <p>Times use {zone}. Add arrival instructions in the description.</p>
    <label>Event date<input type="date" name="eventDate" required /></label>
    {!fixedMode && <label className="checkbox">
      <input type="checkbox" name="eventAllDay" checked={allDay} onChange={event => setAllDay(event.target.checked)} />
      All-day event
    </label>}
    {fixedMode === 'all-day' && <p>All-day event</p>}
    {!allDay && <div className="form-grid">
      <label>Start time<input type="time" name="eventStart" defaultValue={defaultStart} required /></label>
      <label>End time<input type="time" name="eventEnd" defaultValue={defaultEnd} required /></label>
    </div>}
  </fieldset>;
}
