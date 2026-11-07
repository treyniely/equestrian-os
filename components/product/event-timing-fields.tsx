'use client';

import { useState } from 'react';
import EventDatePicker from './event-date-picker';

export default function EventTimingFields({ zone, fixedMode, defaultStart, defaultEnd }: { zone: string; fixedMode?: 'all-day' | 'timed'; defaultStart?: string; defaultEnd?: string }) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [allDay, setAllDay] = useState(fixedMode === 'all-day');

  return <fieldset className="plan-allowance-editor">
    <legend>When is it?</legend>
    <input type="hidden" name="eventRequestKey" value={requestKey} />
    <p>Times use {zone}. Add arrival instructions in the description.</p>
    <EventDatePicker zone={zone} />
    {!fixedMode && <label className="checkbox">
      <input type="checkbox" name="eventAllDay" checked={allDay} onChange={event => setAllDay(event.target.checked)} />
      All-day event
    </label>}
    {fixedMode === 'all-day' && <p>All-day event</p>}
    {allDay && <p>Set when the event begins. It stays on the calendar through the end of that day.</p>}
    <div className="form-grid">
      <label>Start time<input type="time" name="eventStart" defaultValue={defaultStart} required /></label>
      {!allDay && <label>End time<input type="time" name="eventEnd" defaultValue={defaultEnd} required /></label>}
    </div>
  </fieldset>;
}
