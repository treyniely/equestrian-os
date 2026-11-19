'use client';

import { useRef, useState } from 'react';
import { inSegment, type Customer } from '../../domain/programs';
import { defaultFilters, matchingCustomers, type AudienceFilters } from '../../domain/audiences';
import { can, roleGrants } from '../../domain/permissions';
import type { Resource, State, Save } from './types';
import ActionArrow from './action-arrow';
import CategoryLabel, { StatusLabel } from './category-label';
import CommunicationComposer from './communication-composer';
import CustomerAccount from './customer-account';
import CustomerFilters, { customerSegments } from './customer-filters';
import CustomerGroups from './customer-groups';
import Dialog from './dialog';

export default function Customers({ state, save, busy, startCreate = false, initialContactId = '' }: {
  state: State;
  save: Save;
  busy: boolean;
  startCreate?: boolean;
  initialContactId?: string;
}) {
  const [filters, setFilters] = useState<AudienceFilters>({ ...defaultFilters, customerId: initialContactId });
  const [customer, setCustomer] = useState<Customer | null | undefined>(startCreate ? null : undefined);
  const [compose, setCompose] = useState<{ kind: 'message' | 'automation'; filters: AudienceFilters } | null>(
    initialContactId ? { kind: 'message', filters } : null,
  );
  const [group, setGroup] = useState<Resource | null | undefined>(undefined);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const grants = state.permissions ?? roleGrants('owner');
  const showBilling = can(grants, 'billing');
  const canEdit = can(grants, 'customers', true);
  const canDraft = can(grants, 'communications', true);
  const people = matchingCustomers({ ...state, customerGroups: state.customer_groups }, filters);
  const members = state.memberships.filter(membership => membership.status === 'active').map(membership => membership.customer);

  return (
    <>
      <section className="panel customer-roster">
        <div className="panel-heading">
          <h2 ref={resultsHeading} tabIndex={-1}>Customers and riders</h2>
          <div className="button-row">
            {canDraft && <button className="secondary" onClick={() => setCompose({ kind: 'message', filters })}>Draft audience message</button>}
            {canEdit && <button className="primary" onClick={() => setCustomer(null)}>+ Add adult customer</button>}
          </div>
        </div>
        <div className="customer-filter-wrap">
          <div className="segment-tabs" aria-label="Customer segments">
            {customerSegments.filter(segment => segment === 'All customers' || showBilling).map(segment => (
              <button key={segment} aria-pressed={filters.segment === segment}
                className={filters.segment === segment ? 'active' : ''}
                onClick={() => setFilters({ ...filters, segment })}>
                {segment}<span>{state.customers.filter(account => inSegment(account, segment, members)).length}</span>
              </button>
            ))}
          </div>
          <CustomerFilters state={state} filters={filters} onChange={setFilters} compact />
          <div className="customer-results-summary">
            <span role="status">{people.length} {people.length === 1 ? 'account' : 'accounts'} match</span>
            {canDraft && <button className="text-button" onClick={() => setCompose({ kind: 'automation', filters })}>Draft a follow-up rule <ActionArrow /></button>}
          </div>
        </div>
        {people.length ? (
          <div className="table-scroll customer-roster-scroll">
            <table className="family-customer-table" role="table" aria-label="Customer accounts">
              <thead role="rowgroup"><tr role="row">
                <th role="columnheader" scope="col">Adult customer</th>
                <th role="columnheader" scope="col">Riders</th>
                <th role="columnheader" scope="col">Customer groups</th>
                {showBilling && <th role="columnheader" scope="col">Billing · manual</th>}
              </tr></thead>
              <tbody role="rowgroup">{people.map(account => {
                const riders = state.resources.filter(resource => resource.kind === 'rider' && resource.details.customer === account.id);
                const groups = (state.customer_groups ?? []).filter(link => link.customer === account.id)
                  .map(link => state.resources.find(resource => resource.id === link.group_id)?.name).filter(Boolean);
                return (
                  <tr key={account.id} role="row">
                    <td role="cell">
                      <button className="customer-account-link" type="button" onClick={() => setCustomer(account)}>
                        {account.name} <ActionArrow />
                      </button>
                      {account.email && <small>{account.email}</small>}
                      {account.phone && <small>{account.phone}</small>}
                      {!account.email && !account.phone && <small>No contact details</small>}
                      {!account.adult_confirmed && <span className="pill warning">Adult status unconfirmed</span>}
                    </td>
                    <td role="cell" className="customer-roster-riders">
                      <span className="customer-roster-mobile-label" aria-hidden="true">Riders</span>
                      {riders.length ? riders.map(rider => (
                        <div className="customer-rider-line" key={rider.id}>
                          <strong>{rider.name}</strong>
                          <div className="chip-list">
                            <CategoryLabel kind="level" value={rider.details.level ?? 'Beginner'} />
                            {rider.details.group && <small>{state.resources.find(resource => resource.id === rider.details.group)?.name}</small>}
                          </div>
                        </div>
                      )) : <small>No linked riders</small>}
                    </td>
                    <td role="cell" className="customer-roster-groups">
                      <span className="customer-roster-mobile-label" aria-hidden="true">Customer groups</span>
                      <small>{groups.length ? groups.join(', ') : '—'}</small>
                    </td>
                    {showBilling && <td role="cell" className="customer-roster-billing">
                      <span className="customer-roster-mobile-label" aria-hidden="true">Billing · manual</span>
                      {account.billing === 'none' || account.billing === 'current'
                        ? <small>{account.billing === 'current' ? 'Current' : 'No billing record'}</small>
                        : <StatusLabel status={account.billing} billing />}
                      {account.balance !== 0 && <small>{(account.balance / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} outstanding</small>}
                    </td>}
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <div className="empty"><h3>No families match these filters.</h3><p>Try a customer or rider’s name, or clear the filters.</p></div>}
      </section>
      <CustomerGroups state={state} showBilling={showBilling}
        onView={nextFilters => {
          setFilters(nextFilters);
          resultsHeading.current?.focus();
          resultsHeading.current?.scrollIntoView({ block: 'start' });
        }}
        onDraft={canDraft ? nextFilters => setCompose({ kind: 'message', filters: nextFilters }) : undefined}
        onCreate={canEdit ? () => setGroup(null) : undefined}
        onEdit={canEdit ? setGroup : undefined}
      />
      {can(grants,'communications')&&<section className="panel"><div className="panel-heading"><div><h2>Messages & follow-up drafts</h2><p>Drafts only. Delivery and automated sends are not connected.</p></div></div>{state.drafts.length?<div className="resource-grid">{state.drafts.map(d=>{let audience:{eligibleCount?:number;filters?:AudienceFilters}={};try{audience=JSON.parse(d.audience??'{}')}catch{}return <article key={d.id} className="resource-card"><span className="pill">Draft · {d.kind}</span><h3>{d.name}</h3><p>{d.segment} · {d.channel.toUpperCase()}{audience.filters?.level?' · '+audience.filters.level:''}</p><p>{d.message}</p><small>{audience.eligibleCount??'Unreviewed'} eligible at last review. Consent must be checked again before future delivery.</small></article>})}</div>:<div className="empty"><p>Your consent-reviewed drafts will appear here.</p></div>}</section>}
      {customer !== undefined && <CustomerAccount customer={customer} state={state} save={save} busy={busy} close={() => setCustomer(undefined)} />}
      {compose && <CommunicationComposer state={state} save={save} busy={busy} initialFilters={compose.filters} kind={compose.kind} close={() => setCompose(null)} />}
      {group !== undefined && (
        <Dialog title={group ? 'Edit customer group' : 'Create a customer group'} onClose={() => setGroup(undefined)}>
          <p className="helper">Customer groups organize adult accounts.</p>
          <form onSubmit={async event => {
            event.preventDefault();
            const name = new FormData(event.currentTarget).get('name');
            if (await save({ action: 'resource', kind: 'customerGroup', id: group?.id, name })) setGroup(undefined);
          }}>
            <label>Group name<input name="name" defaultValue={group?.name} autoFocus required maxLength={100} /></label>
            <button className="primary submit" disabled={busy}>{group ? 'Save group' : 'Create group'}</button>
          </form>
        </Dialog>
      )}
    </>
  );
}
