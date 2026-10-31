# Product roadmap

Target: lesson businesses and riding academies. Academy website builder excluded.

## 0.1 — Owner development workspace (current)
- Persistent rider, horse, trainer, arena and lesson resources
- Private 45-minute bookings, day selection, cancellation and audit history
- Server suitability/availability checks; atomic database conflict guard
- Owner identity and isolated development workspaces
- Not pilot-ready; use fictional data only

## 0.2 — Programs, customers and guided setup (current)
Templates, group session registration, private party organizers, custom academy labels, CRM accounts/filters, manual membership controls, message/automation drafts. See RELEASE-0.2.md for exact limits.

## 0.3 — Complete booking lifecycle
- Explicit academy settings and guided setup
- IANA timezone, weekly hours, overrides and horse workload
- Academy membership/roles; guardian and rider access
- Service pricing/duration, family booking portal
- Stripe test checkout, verified webhooks, booking holds and email confirmation
- 14-day trial with explicit plan selection; expiry behavior to be designed
Exit: family books and pays for a valid lesson; academy manages it; retry/concurrency checks pass.

## 0.4 — Secure pilot operations
Packages, credit ledger, memberships, waivers, cancellations/rescheduling, live payment reconciliation, reminders, migration tools, monitoring/recovery and independent security review.

## 0.5 — Rider education
Instructor videos/guides, assignments to riders/groups/levels, knowledge checks, progress, instructor-only practical sign-off. Paid course sales excluded initially.

## 0.6 — AI administration and retention
Permissioned setup/scheduling assistant, consequential change previews, audited actions, segmentation and lifecycle journeys with consent.

## 0.7 — Native mobile
Rider and admin applications built on shared server business APIs after responsive workflows are validated.


Release 0.19: availability-first month planning with duration-aware exact placements, day fill and reviewed day/week copying. Release 0.18 retained as Classic weekly planner, sharing the draft. See RELEASE-0.19.md for QA and limits.
