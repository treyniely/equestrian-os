# EquestrianOS workflow and provider audit — 0.35

Date: November 7, 2026. Baseline: Sites source commit a1b0cfc95c990e7381a82ca4d1ac89941d420e19 (version 72), the available conversation, AGENTS.md and repository decision/release notes. This is a source and automated-workflow audit. Authenticated visual verification is separately limited below.

## Capability matrix

| Tab / capability | Baseline behavior and evidence | Action in this release / remaining boundary |
| --- | --- | --- |
| Overview | Operational day/upcoming sessions, manual billing attention and durable one-time setup; `overview-dashboard.tsx`, `setup-guide.tsx` | Retain. Add permission-scoped service readiness. Extend optional setup with communications and learning. Completion remains distinct from provider activation. |
| Calendar | Month/week/day, filtering, availability-aware monthly planning, optional spaces/horses, atomic quick booking, five-second Undo; `sessions.tsx`, `server/monthly-plan.ts`, `server/workspace.ts` | Retain engine and existing records. Notification recipes describe these events; durable event emission/dispatch remains pending. No new payment or scheduling policies. |
| Customers | Adult-first accounts, guardian relationships, linked riders, groups, billing labels, reviewed communication drafts; `customers.tsx`, `customer-account.tsx` | Retain. Dedicated Communications makes prepared rules and campaign drafts easier to find. Existing recipient consent safeguards remain. |
| Communications | Composer and immutable drafts previously nested under Customers; `communication-composer.tsx`, `domain/audiences.ts` | Add recipe setup, per-academy saved preparation states, copy/channel/timing preview, receipt owner, SMS segment estimate, campaign draft management. No dispatch or reported sent/delivered events. |
| Lessons & Offerings | Catalog/templates, custom colors, optional event classes/unlimited pricing, archive/relaunch/remove/restore; `programs.tsx`, `event-pricing.tsx`, `server/offering-retention.ts` | Retain. Events with separately priced classes still need paid checkout and attendee/payment reconciliation before customer purchase is live. |
| Subscriptions | Offering-linked allowances, immutable versions, per-rider benefits, credits, Stripe publication/enrollment/management code; `pricing-plans.tsx`, `server/billing/*` | Retain. Existing provider integration is configured separately and lacks this release's external sandbox verification. One-off packs/family-shared plans remain staff managed. |
| Learning Library | Academy-wide published HTTPS video links/PDFs; no edits/targeting/native video; old `/api/learning` | Complete drafts/edit/publish, search/type filters, selected levels/groups/individual riders, private file access, in-portal supported video playback, MP4 development uploads and audience-reviewed announcement drafts. |
| Riders | Photos/intake/guardian links, academy levels/groups, favorites; `profiles.tsx`, portal profiles | Retain. Learning audiences use actual rider IDs/group IDs and established level names. Never infer a family relationship from user-supplied rider IDs. |
| Horses | Profile/suitability; optional workload guidance; staff care records and document search; `horse-health.tsx` | Retain. No new weekly horse schedule, mandatory horse assignment or family access to health records. |
| Trainers | Profile/levels/hours/breaks/date overrides; preference permissions; reviews removed | Retain. No review feature restored and no monthly-planner rewrite. |
| Riding spaces | Optional in booking/planning; add/remove/restore | Retain. Spaces remain optional. |
| Academy setup | Contact, branding, weekly/date hours, custom labels, GroupMe, checklist; existing Stripe OAuth | Enhance with documented service-setup reviews and real readiness. Preserve connected Stripe accounts until embedded-account configuration is chosen. |
| Barn team | Paid/unpaid worker metadata, roles separate from pay classification, attendance/tasks, approved work and locked CSV; `barn-workers.tsx`, `pay-inputs.tsx` | Retain. Add payroll setup preview for new/migrating payroll and preferred frequency. Gusto secure onboarding, forms, tax calculations and payouts are unconnected. |
| User Management | Role grants/invites/revocation, payroll/time/preference isolation; `team.tsx`, `domain/permissions.ts` | Retain. New endpoints use existing grants. Internal learning/consent/provider/settings records excluded from generic workspace resources. Staff invitations still require existing access gates. |
| Roadmap | Stale text called implemented features future work | Enhance with current capabilities and explicit production dependencies. |
| Courses | No independent Courses tab/model found | Flag. Learning Library is the existing baseline. Paid course sales, exams, completion requirements and level progression are not invented here. |
| Customer portal | Per-rider enrollment/credits/booking changes/favorites and family account | Retain. Add targeted learning per rider and independent lesson/schedule email/SMS preference recording. Marketing opt-ins unchanged; no imported operational opt-in is assumed. |

## Frontend-to-provider contracts

See `PROVIDER-SETUP.md` for official documentation, fields, state transitions, verification prerequisites and the economical sandbox sequence. Frontend review does not create a provider account or mark it approved.

- Payments: current Standard OAuth differs from the proposed embedded experience. Keep it operational and explicitly require a reviewed Connect account configuration/migration. Payment forms and sensitive fields will use Stripe components; EquestrianOS retains benefits and booking logic.
- Messaging: profile/brand/campaign registration, sender verification, suppression callbacks, durable event jobs and send-time state/consent checks must all exist before a prepared automation becomes active. Receipt-owner choice is saved intent until Stripe and dispatch settings are reconciled.
- Learning: this release's private R2 uploads are development storage, limited to 25 MB MP4 and 10 MB PDF. They are functional application uploads and access-controlled streaming responses; they are not a Stream integration. Production Stream work needs direct upload URLs, processing/readiness callbacks, quotas and signed playback. No public file object URLs are returned.
- Payroll: this release saves non-sensitive preferences only. Gusto Embedded approval, secure component mounting, employer/worker record creation, onboarding status, bank/tax/signing steps and submission/status verification remain required.

## Audience and authorization semantics

Selected levels, groups and individual riders form an ANY-match audience. Only currently matching riders see published resources; drafts remain staff-only. A family sees resources for its server-derived rider links, with a rider filter. Both list and direct-file lookup apply the same access check. Eligibility updates dynamically when level/group membership changes. Level names preserve the established implementation; rename migrations are a separate requirement.

Resource access and announcements are separate. Announcements deduplicate adults by customer account, require existing promotional consent and contact/adult eligibility, and remain unsent drafts. More than one eligible child does not produce duplicate messages. Operational preferences have separate defaults and purpose/channel consent history; no current dispatch uses those preferences yet. Future billing notices need their own agreed purpose/channel rules.

## Verification boundary

Automated release suite verifies TypeScript, domain/SQLite/authorization/concurrency tests and production build. New tests cover learning family/academy scoping, hidden drafts, audience validation, optimistic edits, file retention/legacy cleanup, atomic audit rollback, duplicate announcement retries, consent separation, settings concurrency, draft lifecycle and provider-intent validation. Existing booking/credit/payroll tests remain part of the complete suite.

Managed preview started successfully at http://127.0.0.1:4173/. Browser observed the app and new navigation during loading, then the legitimate ChatGPT sign-in boundary. No authentication was bypassed and no production customer records were created for testing. Authenticated desktop/tablet/mobile visual spacing, keyboard-only flows, zoom and media playback remain unverified. There are no provider-sandbox or real-delivery claims in this release.
