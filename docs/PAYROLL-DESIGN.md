# Payroll setup — proposed next module

Status: product/architecture design, not a shipped payroll feature. Lesson plans, booking allowances and current staff scheduling remain the implementation focus of release 0.21.

## The staff experience

Start in Team & Access (with a link from each trainer/intern profile). Add a staff member, link their existing trainer/intern profile if applicable, and choose a compensation arrangement: hourly, per completed lesson, or a combination. Store rates in integer minor units plus currency, with effective dates. Optional lesson-specific rates should select an existing offering rather than recreate lesson types. Configure pay periods at academy level. Keep compensation access separate from general team/scheduling access; instructors must not see each other's rates.

A draft work sheet shows scheduled activities as suggestions. Staff confirm actual start/end, unpaid breaks, completed lessons and any additional barn work. Managers review exceptions and approve actual work. A canceled lesson, a no-show rider, a substitute trainer and additional preparation time need explicit review under academy policy. A schedule is not proof that an employee worked or is owed a particular amount. Do not calculate pay solely from bookings, customer attendance or customer subscription usage. Intern scheduling must not imply that an intern is paid or unpaid.

The pay-period review shows each employee's approved hours/lessons, rate version used, adjustments and total draft earnings. Distinguish forecast, submitted, approved and exported states. Once exported, preserve a locked snapshot and log corrections as revisions rather than silently changing history. Require a preview before an export. The first integration should be a provider-neutral CSV; add one payroll-provider adapter only after a pilot confirms the provider and workflow. Provider-compatible exports need validation against that provider's required schema before being advertised as compatible.

## Data and boundaries

Use staff identities linked to team_access and optional resource profiles. Keep effective-dated compensation agreements, submitted time entries, activity-completion claims, approval records and export snapshots in separate tenant-scoped tables. Do not store rate information in customer-facing trainer profiles or portal directory responses. Use UTC instants and academy local payroll dates, with explicit break records. Support manual adjustments with a required reason and actor. Keep imports/exports retry-safe with a pay-period fingerprint and stable employee mapping.

Provider adapters handle employee onboarding, tax information, deductions, filings and wage disbursement. EO should not collect bank account or tax identification data for a CSV-first MVP. Employee/contractor classification, overtime rules and pay treatment of cancellations are requirements to confirm with the business and its qualified payroll adviser/provider; the software must not infer them from a job title or age. Automatic tax/payroll processing is excluded until provider choice, credentials, permissions and operational responsibilities are established.

## Decisions before implementation

- Pilot provider and its employee identifiers/export format.
- Whether trainers are hourly, per lesson, salaried, contractors or mixed; who approves each person's arrangement.
- Whether per-lesson earnings are per session, per rider or per completed teaching block.
- Paid/unpaid break policy, time capture, edits and approval ownership.
- Cancellation/substitution/no-show handling and treatment of preparation work.
- Pay period dates, correction process and provider handoff.

## Acceptance checks

Tenant isolation and separate payroll permissions; no pay information in any customer payload; effective rate changes preserve prior periods; breaks and overnight work are explicit; overlapping/missing time is flagged; substitutes require approval; duplicate exports are prevented; concurrent approvals do not overwrite each other; manual edits are audited; exported periods retain immutable snapshots. Review the mobile staff-time and desktop manager-approval flows at the standard viewport/keyboard matrix before calling the workflow release-ready.
