# Release 0.16 — Publish times first; plan the academy clearly

## Scheduling and planning
Private lessons no longer require a horse in either individual or monthly scheduling. Academies can publish slots and allow riders to book before assigning horses. Existing mounted group/experience capacity rules remain unchanged.

Planner identity now shows the trainer photo/name and a prominent full month/year on build and review. The default is the next month. Trainer selection uses photo cards. A separate Academy plan mode permits a different lead trainer per block, with shared trainer/location conflicts checked across the master plan. Supporting trainers/interns remain available. Customer booking adds a Trainer filter and shows all trainers assigned to a shared session. Date badges use academy local time.

The former green availability box is replaced with a weekly-hours table and separate, readable time-off ranges/academy closures. Different profile and academy time zones are explicit. Weekly availability now accepts up to six lunch/break windows per day, validates overlap/bounds, and blocks new bookings via the shared availability function. Copy Monday to weekdays reduces repetitive setup. Existing bookings are retained when hours change.

Find available times offers up to three candidate starts, accounting for weekday/occurrence choices, profile/academy hours, breaks, days off, existing reservations and other completed blocks in the proposal. Suggestions are deterministic; they are not AI generation or a guarantee of publication. Full server preview/save revalidates. Past or unavailable occurrences default to unchecked; proposed overlaps remain visible for review. Planning supports the existing 100-session/800-write bounds.

## Horse recommendations and preparation
Horse profiles expose optional daily/weekly lesson targets and minimum-break guidance without restoring a weekly horse schedule. No default welfare thresholds are invented. Recommendations after booking consider rider suitability, horse favorites, current resource conflicts, scheduled day/week usage and targets. Horse choices outside suitability/availability are blocked; workload guidance requires a staff override reason in the reviewed assignment workflow. Targets guide recommendations rather than enforcing universal hard caps across every booking path, and scheduled demand is not measured exertion or a health assessment. Staff remain responsible for horse care.

A session’s Recommend horses action reviews all enrolled riders, gives favorites with fewer alternatives first consideration, and suggests different eligible horses. Staff can leave riders unassigned or choose another eligible horse. Confirmed assignments reserve each horse once and generate preparation tasks for available interns, favoring session-assigned interns; otherwise tasks remain clearly unassigned. No automatic horse assignment occurs at family checkout. Existing in-progress preparation must be reviewed before changing a horse. Replaced auto-reservations and obsolete pending tasks are released/canceled; enrollment removal releases auto-assigned horses and cancels unfinished preparation. Preselected group horse pools remain reserved. Task history is retained.

New tenant-scoped rider_horses and session_horse_plans tables use unique rider/horse-per-session constraints, enrollment guards and an optimistic revision trigger. Stale concurrent edits roll back atomically. Resource reservation triggers continue to prevent double bookings. Override reasons remain in the staff assignment record and are not selected into the family API.

## Monthly launch communications
Authorized staff can review/edit a launch-email subject/body while publishing the month. The final action atomically creates bookable sessions and one draft, filtering out contacts without adult confirmation, email consent or an email address. It adds the academy booking-portal link. Retry fingerprints prevent duplicate sessions/drafts. Staff need schedule management, customer viewing and communication management permissions. Draft delivery is NOT connected; no email or SMS is sent. Provider integration and fresh send-time consent checks remain necessary before live automation.

## MVP scope and architecture
Removed academy creation/switching from the admin interface and disabled mutations at /api/academies. Its read response exposes only the current authorized academy. Existing academy records, tenant isolation and current selection are retained; no customer/academy data is deleted. Multi-academy owner management is deferred until there is customer demand.

Domain planning/availability/recommendation rules stay separate from React composition and persistence. Shared existing booking/calendar/contact/task services are reused. No dependencies or AI/provider SDKs added. The obsolete academy switcher and green availability-box styles were removed.

Migration: 0013_living_loki adds the rider-horse/revision tables, indexes and lifecycle/optimistic-concurrency triggers. Lunch/breaks and horse targets extend resource JSON and need no destructive schema change. No new secrets/configuration. Rollback: restore the previous Site version and retain additive tables/triggers; do not reverse applied migrations. Migrations were checked for schema drift before release.

## Validation
TypeScript, 117 automated tests and production build passed before publication. New tests cover optional private horses/family booking, favorites and workload ranking, explicit overrides, intern tasks, replacement/release, tenant/suitability protection, concurrent plan edits, atomic consent-filtered launch drafts/retries, valid lunch boundaries/invalid breaks, recommended starts and multi-trainer master plans.

Source UI review covered photo fallbacks, month/trainer hierarchy, neutral availability surfaces, grouped time-off ranges, select insets, checkbox hit areas, break editing, action wrapping, ghost buttons, existing fixed dialog headers and mobile grid stacking. DesignOS guidance applied to the planner composition. The managed preview route previously returned net::ERR_CONNECTION_REFUSED and there is no evidence of browser-route recovery. Browser screenshots, keyboard interaction, zoom and 390/768/1440px visual QA remain unverified; passing source/build checks is not a visual QA pass.
