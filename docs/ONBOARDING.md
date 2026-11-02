# Academy setup and overview

## Essential setup

The previous checklist checked for a name, trainer, offering, customer and any scheduled session. It missed contact/location, saved business hours/time zone, trainer schedules and plan coverage; historical or canceled lessons could misleadingly count as ready. It also required a customer before a new academy was ready to accept its first family.

The revised guide uses server-derived evidence from the complete tenant workspace:

1. Academy name.
2. Business street address and city, plus a business phone or email.
3. Explicitly saved valid academy hours/time zone with at least one enabled day. Merely displayed defaults do not count.
4. At least one trainer; all trainers need valid saved availability with at least one enabled teaching day. Profiles identify schedules not yet confirmed.
5. At least one active offering with duration, capacity and a supported access model.
6. Conditional: every active plan-only offering is included in at least one valid plan allowance. Plans referencing missing/archived offerings do not satisfy coverage.
7. At least one future, scheduled session for an active offering with an existing assigned trainer. Past/canceled/orphan sessions do not count.

The conditional plan step is omitted for businesses with only paid drop-ins/free activities. Horse assignments and riding spaces remain optional. Setup does not require creating fictional families or subscribing a rider. Final review shows the academy’s cancellation/rescheduling notice, links to the signed-in family portal, explains credits/preferences and explicitly shows checkout/messaging status. Staff acknowledge review before finishing. A family account may be required to exercise the complete portal flow; the checkbox is staff attestation, not an automated end-to-end test.

Logo/colors, Stripe/online plan publishing, optional pricing packages, customer/rider imports, horse profiles, riding spaces, custom rider levels/groups, staff access, interns and GroupMe are in a collapsed optional guide in Academy setup. Existing functional settings stay in their normal sections. Contacts/hours/branding/payment/plan links scroll to their relevant section; creating a customer is skipped if adult accounts already exist so staff can link riders instead of duplicating adults.

## Completion lifecycle

`finishOnboarding` is protected by setup management, same-origin/authentication and server-selected tenant access. The server rereads requirements; a browser flag cannot mark an incomplete academy ready. One durable row per academy records completed_at. Insert-once completion and its audit entry are atomic and retry-safe, including parallel completion attempts.

After successful review/finish, a one-time dialog includes short decorative confetti and a return-to-overview action. Escape, close and backdrop dismissal use the shared dialog. Reduced-motion preferences hide confetti. Dismissing returns to the operational overview. Reloads, new devices and future resource changes do not reintroduce the checklist or replay celebration. Completion is not browser-local storage. Academy setup offers Review setup guide without resetting or repeating completion. An explicit future reset/versioned migration is out of scope.

## Setup complete versus live services

The completion milestone means academy essentials are saved and ready for day-to-day management; it does not claim payments, message delivery, waivers or pilot launch reviews are complete. The current environment has unconfigured Stripe and draft-only messaging. Final review shows those limits before acknowledgement and completion never enables a provider.

Online status counts only current monthly per-rider plans whose canonical snapshot matches the connected account’s published catalog and whose included offerings remain active. A test account is clearly distinct from live mode. Catalog presence is not a new guarantee of Stripe account capabilities or end-to-end settlement. Setup does not change family entitlements or payment logic.

## Daily overview

The primary overview now shows the academy-local date, today’s session count, the next five upcoming/still-running sessions, trainer assignments and booked/capacity values. Clicking a session opens that session and its correct calendar month. Party capacities are treated as one exclusive booking. Empty states lead to the calendar. Secondary summaries link to adult customers, riders and active offerings, and customer attention is shown only with both customer and billing access. Booking updates/activity remain available. Hidden features do not appear as misleading zero metrics.

No new dependency, analytics service or dashboard reporting engine was added. Readiness rules are in domain/onboarding.ts, persistence in server/onboarding.ts, and guided/operational UI in focused components rather than expanding Workspace’s inline logic. Migration 0022_short_sway adds the completion table. Rollback keeps that additive table so completion history survives.
