import { useId } from 'react';
import { ChevronRight, Layers, MessageSquare, MoreHorizontal, Users } from 'lucide-react';
import { defaultFilters, matchingCustomers, type AudienceFilters } from '../../domain/audiences';
import type { Resource, State } from './types';

type Group = {
  label: string;
  filters: AudienceFilters;
  resource?: Resource;
};

type Props = {
  state: State;
  showBilling: boolean;
  onView: (filters: AudienceFilters) => void;
  onDraft?: (filters: AudienceFilters) => void;
  onCreate?: () => void;
  onEdit?: (group: Resource) => void;
};

function GroupCard({ group, count, onView, onDraft, onEdit }: {
  group: Group;
  count: number;
} & Pick<Props, 'onView' | 'onDraft' | 'onEdit'>) {
  const actionsId = useId();
  const resource = group.resource;
  const Icon = resource ? Layers : Users;

  return (
    <article className="customer-group-card" data-custom={Boolean(resource)}>
      <div className="customer-group-card-heading">
        <button type="button" className="customer-group-link" onClick={() => onView(group.filters)}>
          <span className="customer-group-icon"><Icon size={18} aria-hidden="true" /></span>
          <span><strong>{group.label}</strong><small>{count} {count === 1 ? 'account' : 'accounts'}</small></span>
          <ChevronRight size={17} aria-hidden="true" />
        </button>
        {resource && onEdit && (
          <div className="customer-group-actions">
            <button type="button" className="customer-group-more" aria-label={`Actions for ${group.label}`} popoverTarget={actionsId}>
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            <div id={actionsId} popover="auto" className="customer-group-popover">
              <button type="button" popoverTarget={actionsId} popoverTargetAction="hide" onClick={() => onEdit(resource)}>
                Edit group
              </button>
            </div>
          </div>
        )}
      </div>
      {onDraft && (
        <button type="button" className="customer-group-draft" disabled={!count} onClick={() => onDraft(group.filters)}>
          <MessageSquare size={16} aria-hidden="true" /> Draft message
        </button>
      )}
    </article>
  );
}

export default function CustomerGroups({ state, showBilling, onView, onDraft, onCreate, onEdit }: Props) {
  const levels = Array.from(new Set(state.resources.flatMap(resource => {
    if (resource.kind === 'level') return [resource.name];
    return resource.kind === 'rider' ? [resource.details.level ?? 'Beginner'] : [];
  })));
  const builtIn: Group[] = [{ label: 'All customers', filters: defaultFilters }];
  if (showBilling) {
    builtIn.push(
      { label: 'Active customers', filters: { ...defaultFilters, segment: 'Active' } },
      { label: 'Inactive customers', filters: { ...defaultFilters, segment: 'Inactive' } },
    );
  }
  for (const level of levels) {
    builtIn.push({ label: `${level} riders`, filters: { ...defaultFilters, level } });
  }
  const custom = state.resources.filter(resource => resource.kind === 'customerGroup').map(resource => ({
    resource,
    label: resource.name,
    filters: { ...defaultFilters, customerGroup: resource.id },
  }));
  const audience = { ...state, customerGroups: state.customer_groups };
  const renderGroups = (groups: Group[]) => (
    <div className="customer-group-grid">
      {groups.map(({ resource, ...group }) => (
        <GroupCard key={resource?.id ?? group.label} group={{ ...group, resource }}
          count={matchingCustomers(audience, group.filters).length} onView={onView} onDraft={onDraft} onEdit={onEdit} />
      ))}
    </div>
  );

  return (
    <section className="panel customer-groups-panel">
      <div className="panel-heading">
        <h2>Customer groups</h2>
        {onCreate && <button type="button" className="secondary" onClick={onCreate}>+ Create customer group</button>}
      </div>
      <div className="customer-group-sections">
        <div>
          <h3>Built-in groups</h3>
          {renderGroups(builtIn)}
        </div>
        <div>
          <h3>Custom groups</h3>
          {custom.length ? renderGroups(custom) : <p>No custom groups yet.</p>}
        </div>
      </div>
    </section>
  );
}
