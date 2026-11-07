# EquestrianOS product reference

Updated November 7, 2026

This reference is saved with the application source, independently of chat history. Status describes application capability, not pilot readiness.

## Product direction — Lesson businesses and riding academies

Status: Decision

Responsive admin and family portals first. A 14-day guided trial, recorded demo and guided setup are the intended acquisition experience. Academy website builder is excluded. Native admin and consumer apps follow validated shared APIs; they are not available yet.

Source: AGENTS.md; docs/ROADMAP.md

## Onboarding — Setup happens inside EquestrianOS

Status: Decision

Use provider documentation as the contract for realistic setup. Keep academy settings in EO and use secure provider components for identity, bank and tax details. Show pending, rejected and verified states from the provider. Completing the academy checklist does not imply provider approval.

Source: docs/PROVIDER-SETUP.md; docs/ONBOARDING.md

## Communications — Ready-made messages from the first visit

Status: Available

Communications → Automations shows prewritten wording, triggers, timing and channel. Core email rules are prepared by default and saved when academy setup finishes. Admins can preview, customize or turn preparation off. Provider delivery remains off until connected and verified; no historical events should be replayed on activation.

Source: domain/message-recipes.ts; domain/communication-settings.ts; server/onboarding.ts

## Communications — Core automation list and timing

Status: Provider setup required

Booking confirmation immediately after a booking; lesson reminder 24 hours before; reschedule and cancellation updates immediately; membership confirmation only after the first paid invoice; renewal reminders configurable 7, 3 or 1 day before; successful-payment receipt; failed-payment follow-up after the verified failure. The templates and settings exist. Event dispatch, queue and provider delivery are pending.

Source: domain/message-recipes.ts; docs/RELEASE-0.35.md

## Communications — One payment, one receipt sender

Status: Decision

Stripe is the default receipt owner. EO receipt automation stays unprepared when Stripe owns receipts. Before enabling EO receipts, reconcile the provider settings so families do not receive duplicates. A local receipt preference alone never changes Stripe settings.

Source: domain/communication-settings.ts; docs/PROVIDER-SETUP.md

## Communications — Optional notifications

Status: Provider setup required

Card-expiration reminder when Stripe supplies expiry data, and new-learning-resource announcements to selected eligible adult contacts. Library access and announcements are separate; publishing must not automatically contact every family.

Source: domain/message-recipes.ts; docs/WORKFLOW-AUDIT-0.35.md

## Ideas & backlog — Growth and lifecycle ideas retained

Status: Planned

Welcome journey, package-renewal or low-credit alerts, consented abandoned-booking follow-up, inactive-customer reactivation, birthday messages, clinic and camp campaigns, segmentation, visual journey building, AI-assisted drafting and communication reporting. Clinic/camp campaign copy exists; these ideas are not all implemented automated journeys. Promotions require separate audience consent and an admin review.

Source: Recovered conversation requirements; docs/ROADMAP.md; domain/message-recipes.ts

## Communications — Operational and marketing preferences stay separate

Status: Decision

Record adult guardian channel, purpose, consent source, wording and timestamp. Imported contacts never imply marketing permission. Respect STOP, unsubscribe and suppression. Future dispatch rechecks current consent, booking/payment state, and recipients; deduplicates events, replaces stale reminders, retries safely and records delivery status and SMS usage. Preference recording exists; dispatch infrastructure is pending.

Source: domain/communication-consent.ts; server/communication-consent.ts; docs/PROVIDER-SETUP.md

## Scheduling — Preserve the booking and credit engine

Status: Available

Month/week/day views, availability-first planning, academy time zone and closures, trainer hours and time off, optional riding spaces and horses, suitability checks, capacity enforcement, atomic reservations and credit use, reviewed changes and five-second scheduling Undo. Selected favorites never override availability or suitability.

Source: docs/WORKFLOW-AUDIT-0.35.md; server/workspace.ts; server/monthly-plan.ts

## Customers & riders — Adult accounts with linked riders

Status: Available

Adult-first customer creation, multiple guardian relationships and emergency contacts, rider profiles/photos, custom levels and groups, favorite horses and preferred trainers. Contact parents through the adult account. Family identity and rider access are derived on the server; staff permissions apply independently.

Source: docs/FAMILY-ONBOARDING.md; server/portal.ts; domain/permissions.ts

## Customers & riders — Consistent visual level and color pickers

Status: Available

Rider levels use a visual icon picker and event-style color palette with badge preview. Existing level names remain stable because assignments match by name. Custom colors use the established contrast-adjusted academy theme.

Source: docs/RELEASE-0.34.md; components/product/level-editor.tsx

## Payments — Plans, credits and connected subscriptions

Status: Provider setup required

Offering-linked allowances, immutable paid-period terms, per-rider credits and booking enforcement exist. Stripe catalog, checkout, signed webhook and management adapters exist behind runtime configuration. Standard OAuth remains the existing connection. Embedded onboarding needs an account-model decision and sandbox verification; one-off packs and family plans remain staff managed.

Source: docs/STRIPE-BILLING.md; docs/PROVIDER-SETUP.md

## Learning Library — Private learning with selected audiences

Status: Available

Draft/edit/publish, search and type filters, hosted video playback, development MP4 uploads up to 25 MB and PDFs up to 10 MB. Share academy-wide or with selected levels, groups or riders. Both list and file access enforce current linked-family eligibility. Guardian announcement drafts are deduplicated and consent-reviewed.

Source: docs/RELEASE-0.35.md; server/learning.ts

## Ideas & backlog — Courses and production video

Status: Planned

Advanced courses, knowledge checks, progression requirements and instructor practical sign-off remain future work. Paid course sales are excluded initially. Cloudflare Stream production upload/processing, signed playback, quota and usage metering need integration; current private uploads do not imply that Stream is connected.

Source: docs/ROADMAP.md; docs/PROVIDER-SETUP.md

## Horses & trainers — Horse care and trainer boundaries

Status: Available

Horse profiles, suitability, care files, manual due dates and scoped search are staff-only. AI record organization requires configured provider access and review. Horse weekly availability stays removed. Trainer hours/time off exist; trainer reviews remain removed. Trainer preferences have separate restricted grants.

Source: docs/HORSE-HEALTH-DESIGN.md; docs/RELEASE-0.30.md

## Barn team — Operations and reviewed pay inputs

Status: Available

Daily attendance, assigned tasks and handoffs; independent staff roster; actual-work drafts, supervisor approvals and immutable CSV exports. Software access and employment classification are separate. A schedule is not evidence of worked time or payment. Rate metadata does not calculate wages.

Source: docs/RELEASE-0.33.md; docs/PAYROLL-DESIGN.md

## Barn team — Embedded payroll and migration

Status: Provider setup required

Gusto employer and worker onboarding, secure tax/bank forms, prior-payroll migration, provider approval, calculation, submission and payouts remain pending. Preserve approved time and CSV export while implementing the provider adapter. Never collect sensitive payroll fields in a mock EO checklist.

Source: docs/PROVIDER-SETUP.md; docs/PAYROLL-DESIGN.md

## Architecture & QA — Shared secure APIs and release gates

Status: Decision

Server identity, academy isolation, role grants and guardian/rider authorization; atomic retry-safe booking; UTC instants with academy IANA time zones; integer minor-unit money; signed and deduplicated payment events. AI must use these same permissions and previews for consequential actions. Synthetic checks do not replace sandbox or security review.

Source: AGENTS.md; docs/ARCHITECTURE.md; docs/RELEASE-QA.md

## Architecture & QA — Current verification limits

Status: Decision

Every release runs TypeScript, domain/authorization/concurrency tests and production build. Authenticated mobile/tablet/desktop, keyboard, zoom and provider sandbox checks must be reported separately. Development records and local previews must never be labeled paid, sent, verified or production-ready without evidence.

Source: docs/RELEASE-QA.md; docs/RELEASE-0.35.md