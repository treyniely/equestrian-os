'use client';

import { useState } from 'react';
import Dialog from './dialog';
import EventTimingFields from './event-timing-fields';
import type { Resource, Save, Session } from './types';

export type PastEvent = { offering: Resource; last: Session };

export default function PastEvents({ events, zone, busy, canPublish, canRemove, save, onRemove }: {
  events: PastEvent[];
  zone: string;
  busy: boolean;
  canPublish: boolean;
  canRemove: boolean;
  save: Save;
  onRemove: (offering: Resource) => void;
}) {
  const [selected, setSelected] = useState<PastEvent | null>(null);
  if (!events.length && !selected) return null;

  const time = new Intl.DateTimeFormat('en-GB', {timeZone:selected?.offering.details.eventZone??zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  return <>
    <details className="removed-offerings">
      <summary>Past events · {events.length}</summary>
      <p>Finished events move here automatically. Relaunch an event to publish a new date using its existing settings.</p>
      {events.map(event => {
        const { offering, last } = event;
        const date = new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium', timeZone: offering.details.eventZone ?? zone,
        }).format(last.start);
        return <div key={offering.id}>
          <strong>{offering.name} · {date}</strong>
          <span className="button-row">
            {canPublish && <button className="secondary" disabled={busy} onClick={() => setSelected(event)}>Relaunch event</button>}
            {canRemove && <button className="secondary" disabled={busy} onClick={() => onRemove(offering)}>Remove event</button>}
          </span>
        </div>;
      })}
    </details>
    {selected && <Dialog title={'Relaunch ' + selected.offering.name} onClose={() => { if (!busy) setSelected(null); }}>
      <p>Publish a new date with the same event details, price and capacity. The new date starts with an empty roster.</p>
      <form onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (await save({
          action: 'relaunchEvent',
          id: selected.offering.id,
          eventRequestKey: form.get('eventRequestKey'),
          eventTiming: { date: form.get('eventDate'), start: form.get('eventStart'), end: form.get('eventEnd') },
        })) setSelected(null);
      }}>
        <EventTimingFields zone={selected.offering.details.eventZone ?? zone} fixedMode={selected.offering.details.eventMode ?? 'timed'} defaultStart={time.format(selected.last.start)} defaultEnd={time.format(selected.last.end)} />
        <button className="primary submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish new date'}</button>
      </form>
    </Dialog>}
  </>;
}
