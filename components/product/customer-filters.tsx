'use client';

import { useState } from 'react';
import { can, roleGrants } from '../../domain/permissions';
import type { AudienceFilters } from '../../domain/audiences';
import type { State } from './types';

export const customerSegments = ['All customers', 'Needs attention', 'Active', 'Inactive'];

type Props = {
  state: State;
  filters: AudienceFilters;
  onChange: (filters: AudienceFilters) => void;
  includeSegment?: boolean;
  compact?: boolean;
};

export default function CustomerFilters({ state, filters, onChange, includeSegment = false, compact = false }: Props) {
  const [showMore, setShowMore] = useState(false);
  const update = (key: keyof AudienceFilters, value: string) => onChange({ ...filters, [key]: value });
  const levels = Array.from(new Set(state.resources.flatMap(resource => {
    if (resource.kind === 'level') return [resource.name];
    return resource.kind === 'rider' ? [resource.details.level ?? 'Beginner'] : [];
  })));
  const optIns = [
    ['email', 'Email opted in'],
    ['sms', 'SMS opted in'],
    ['both', 'Email & SMS opted in'],
    ['neither', 'No channel opt-ins'],
  ];
  const activeFilters = [
    ['level', 'Rider level', filters.level],
    ['riderGroup', 'Rider group', state.resources.find(resource => resource.id === filters.riderGroup)?.name],
    ['customerGroup', 'Customer group', state.resources.find(resource => resource.id === filters.customerGroup)?.name],
    ['optin', 'Contact opt-ins', optIns.find(([value]) => value === filters.optin)?.[1]],
  ] as const;
  const hasFilters = Boolean(filters.query || filters.level || filters.riderGroup || filters.customerGroup || filters.optin || filters.customerId);
  const riderGroup = (
    <label>Rider group
      <select value={filters.riderGroup} onChange={event => update('riderGroup', event.target.value)}>
        <option value="">All rider groups</option>
        {state.resources.filter(resource => resource.kind === 'group').map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
      </select>
    </label>
  );
  const optIn = (
    <label>Contact opt-ins
      <select value={filters.optin} onChange={event => update('optin', event.target.value)}>
        <option value="">All contacts</option>
        {optIns.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );

  return (
    <div className={compact ? 'customer-filters customer-filters-compact' : 'customer-filters'}>
      {filters.customerId && (
        <div className="single-contact-filter">
          Contact: {state.customers.find(customer => customer.id === filters.customerId)?.name ?? 'Selected adult'}
          <button type="button" className="text-button" onClick={() => update('customerId', '')}>View all accounts</button>
        </div>
      )}
      {includeSegment && (
        <label>Customer segment
          <select value={filters.segment} onChange={event => update('segment', event.target.value)}>
            {customerSegments.filter(segment => segment === 'All customers' || can(state.permissions ?? roleGrants('owner'), 'billing'))
              .map(segment => <option key={segment}>{segment}</option>)}
          </select>
        </label>
      )}
      <label className="customer-search-field">Search customers or riders
        <input placeholder="Name, rider, email or phone…" value={filters.query} onChange={event => update('query', event.target.value)} />
      </label>
      <label>Rider level
        <select value={filters.level} onChange={event => update('level', event.target.value)}>
          <option value="">All levels</option>
          {levels.map(level => <option key={level}>{level}</option>)}
        </select>
      </label>
      {!compact && riderGroup}
      <label>Customer group
        <select value={filters.customerGroup} onChange={event => update('customerGroup', event.target.value)}>
          <option value="">All customer groups</option>
          {state.resources.filter(resource => resource.kind === 'customerGroup').map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
        </select>
      </label>
      {!compact && optIn}
      <div className="customer-filter-actions">
        {compact && <button type="button" className="secondary" aria-expanded={showMore} onClick={() => setShowMore(!showMore)}>More filters</button>}
        <button type="button" className="text-button" disabled={!hasFilters}
          onClick={() => onChange({ segment: filters.segment, query: '', level: '', riderGroup: '', customerGroup: '', optin: '' })}>
          Clear filters
        </button>
      </div>
      {compact && showMore && <>{riderGroup}{optIn}</>}
      {compact && activeFilters.some(([, , value]) => value) && (
        <div className="customer-applied-filters" aria-label="Applied filters">
          {activeFilters.map(([key, label, value]) => value && (
            <button type="button" key={key} className="pill" aria-label={`Remove ${label}: ${value}`} onClick={() => update(key, '')}>
              {label}: {value} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
