'use client';

import { useState } from 'react';
import Dialog from './dialog';
import type { Resource, Save } from './types';

export default function RidingSpaces({ spaces, save, busy, readOnly }: {
  spaces: Resource[];
  save: Save;
  busy: boolean;
  readOnly: boolean;
}) {
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState<Resource | null>(null);
  const active = spaces.filter(space => !space.details.archived && space.name.toLowerCase().includes(query.trim().toLowerCase()));
  const removed = spaces.filter(space => space.details.archived);

  return <section className="panel">
    <div className="panel-heading">
      <div><h2>Riding spaces</h2><p>Locations you can reserve on the calendar.</p></div>
      <label className="search">
        <input aria-label="Search riding spaces" placeholder="Search…" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
    </div>
    {active.length ? <div className="resource-grid">{active.map(space => <article className="resource-card" key={space.id}>
      <div className="resource-avatar">{space.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</div>
      <h3>{space.name}</h3>
      {!readOnly && <button className="secondary" disabled={busy} onClick={() => setRemoving(space)}>Remove space</button>}
    </article>)}</div> : <div className="empty"><p>{query ? 'No matching spaces.' : 'No riding spaces added yet.'}</p></div>}
    {removed.length > 0 && <details className="removed-offerings">
      <summary>Removed spaces · {removed.length}</summary>
      {removed.map(space => <div key={space.id}>
        <strong>{space.name}</strong>
        {!readOnly && <button className="secondary" disabled={busy} onClick={() => save({action:'restoreSpace',id:space.id})}>Restore</button>}
      </div>)}
    </details>}
    {removing && <Dialog title={'Remove ' + removing.name + '?'} onClose={() => setRemoving(null)}>
      <p>This space will disappear from new scheduling choices. Existing sessions keep their assigned space.</p>
      <div className="dialog-actions">
        <button className="secondary" onClick={() => setRemoving(null)}>Keep space</button>
        <button className="primary" disabled={busy} onClick={async () => {
          if (await save({action:'removeSpace',id:removing.id})) setRemoving(null);
        }}>Remove space</button>
      </div>
    </Dialog>}
  </section>;
}
