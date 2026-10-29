# Release 0.2 — Programs, customer management and guided setup

## Delivered
- Programs & Services replaces Lesson types, with seven starting formats and conditional details.
- Configurable names, duration, capacity, mounted/unmounted, manual price/access, optional level and discipline.
- Scheduled sessions reserve instructors, spaces and horses once. Registrations use atomic capacity and rider-overlap guards. Private parties admit one organizer for exclusive use.
- Existing private bookings remain readable/cancelable; no destructive backfill.
- Customer accounts, rider links, search, attention/member/inquiry/inactive segments, manually recorded balances, account notes and channel permissions.
- Manual membership add/change/pause/resume/cancel with review before confirmation. No financial side effects.
- Message and follow-up automation drafts with channel-specific recipient preview. No scheduler or delivery provider is activated.
- Guided academy checklist, custom level/discipline/group names and rider group assignment.

## Architecture review
UI split into Programs, Customers, Sessions and native accessible Dialog components, with shared types. Pure template/segment logic lives in domain/programs; authenticated application operations in server/workspace. No new dependencies. No changes to applied migration 0000. Schema-only migration 0001 adds new tables/indexes and guards. Reads/writes are tenant-scoped; owner workspaces are still not multi-role academy memberships.

Atomic checks protect capacity, duplicate registrations, cross-session rider conflicts, exclusive parties and resource reservations. Session request keys deduplicate retries. Legacy booking conflicts remain enforced. D1 batch failures roll back new sessions and reservations together. New server behaviors tested against real SQLite migrations using Node's built-in SQLite adapter.

## Limits / next
Fictional data only. Availability remains 8 AM–6 PM UTC; not recurring or timezone-aware. Mounted sessions require at least one reserved horse per available spot, not per attendee. Horse assignments are session-level and beginner checks are conservative; a full per-rider suitability engine is still required. Groups are labels; discipline is descriptive, level eligibility uses exact names. Camps/clinics are individual sessions, not series registration. Prices/access are metadata, not billing or membership entitlements. CRM balances/statuses and membership records are manually entered; no Stripe transactions, credits or subscription charges occur. Communications/automation remain saved drafts, with no delivery or background trigger execution. Family self-service, provider webhooks, waivers, education, AI and native apps remain roadmap work. No website builder.

## Operations
Deploy the exact reviewed source and migration 0001 through Sites. Keep migration 0000 immutable. Rollback app code only if required; retain new tables and records. No automatic GitHub-to-Sites sync. Confirm the GitHub commit and Sites deployment separately.
