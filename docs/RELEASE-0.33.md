# Membership, messaging and pay-input enhancements

| Capability | Baseline and evidence | Release action |
| --- | --- | --- |
| Membership catalog and terms | Stripe catalog snapshots in server/billing/catalog.ts and paid-period snapshots in server/plans.ts preserve subscriber terms. | Retain the version model. Add a family-facing preview to the existing plan form. |
| Payment setup and family billing | Academy setup uses Stripe Standard OAuth. Server-side connected-account calls support publication, rider checkout, invoice handling and a hosted payment-management portal. | Retain. Verify the current path in an isolated Stripe sandbox before changing the account model. Embedded onboarding is a separate account-migration decision. |
| Credits and booking | Enrollment triggers reserve capacity and debit a credit in the same write. Existing tests cover sibling separation, stale allowance decisions, paid-period boundaries, cancellation and rescheduling. | Retain. Monthly periods do not roll over. Preserve existing standing-lesson, makeup and cancellation rules. |
| Messaging | The composer previews a filtered adult audience and persists consent-checked drafts. The draft write has no provider or worker side effect. | Enhance draft composition with recipes, explicit triggers, timing and personalized sample previews. Keep delivery off. |
| Team and interns | Team access and the Barn team board manage role grants, absences and assigned tasks. | Retain. Staff shift capture, supervisor completion review and suggestions from completed sessions remain open. |
| Payroll | PAYROLL-DESIGN.md described a future module. | Add actual-work drafts, correction and approval history, pay-period review and an immutable provider-neutral CSV. Time approval and payroll export are independent grants. |
| Native and provider runtime | Sites Workers host the web routes with D1. | Retain. Native clients need a supported authenticated API contract. Messaging needs a durable queue and scheduler with verified unattended execution. |

## Boundaries

Only the owner receives time approval and payroll grants by default. Existing roles and stored grants remain restricted until explicitly updated. Pay inputs use active team identities and an academy-local work date. The CSV reports minutes and completed lessons without wage calculations or employment classification. Export locks an inclusive date range after a fresh review of the same record revisions. Exact-range downloads reuse the original snapshot. Corrections before export require reapproval. Post-export revisions and provider-specific imports remain open.

Migration 0024 adds three tables and period guards. Existing data is unchanged. No new dependencies or runtime secrets. For rollback, redeploy the previous build and preserve work and export tables.

## Verification and dependencies

- Automated tests use synthetic SQLite records and mocked Stripe calls. The managed preview relay was unavailable, so responsive layout, keyboard use and actual browser CSV download remain unverified.
- Stripe sandbox needs test platform credentials, an isolated academy, callback and signed connected-account events. Keep the academy's SaaS subscription separate. Stripe should own receipts for paid invoices when receipt delivery is enabled. The application must exclude those events from any duplicate receipt delivery.
- Message dispatch needs approved sender setup, distinct service and marketing consent history, STOP and unsubscribe callbacks, verified schedule and booking event state at dispatch, durable retries, delivery callbacks, test recipients, and tenant usage measurement. No outbound provider is configured or called by this release.
- Gusto demo evaluation should use a partner-managed company and company, worker, and payroll Flows. Verify stable worker mapping, approved-input transfer, submission, and status webhooks in demo before production approval. The CSV has no Gusto-specific import mapping. See https://docs.gusto.com/embedded-payroll/docs/getting-started and https://docs.gusto.com/embedded-payroll/docs/payroll-events.

## Barn team and User Management

Barn team now contains Daily operations and Staff & payroll. User Management retains software roles and grants. Payroll-authorized users can create independent roster records for employees, contractors, unpaid placements and pending classifications. Paid records can be selected in time review without a software account. Existing user-linked work entries are preserved. Staff pay settings are setup metadata and do not calculate or alter CSV earnings. Provider invitations, secure tax forms, effective-dated pay history and payroll processing remain pending. Migration 0025 adds the tenant-scoped roster table. Preserve it on rollback.

## Family booking demo

The admin header links to an authenticated demo of the existing family portal. It uses fictional rider memberships and local, resettable booking changes. It never calls the booking, messaging, or payments backend. Real credit cards show the membership name, and late reschedule failures explain the academy's existing shared cutoff. No new runtime secrets or schema changes. Redeploy the prior source to remove the demo.
