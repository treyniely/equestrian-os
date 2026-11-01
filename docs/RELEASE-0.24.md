# Release 0.24 — Calendar, family booking and familiar faces

The admin calendar now has Month, Week and Day views, date navigation and trainer/offering/status filters. It includes retained legacy bookings, shows concurrent sessions side by side, and opens session details. Saving a session moves to its date and clears filters; monthly publishing moves to the planned month. Academy-local dates and midnight boundaries are handled in a small domain module. Existing planners remain available.

Family booking automatically selects a sole rider and requires a choice when multiple riders exist. The selected rider’s eligible rider/shared-family allowances show remaining sessions, usage and period dates. Selecting an allowance filters matching bookable lessons. Successful bookings stay on the booking page with refreshed balances. No balance is fabricated from legacy memberships.

Families must give a short reason when cancelling or rescheduling. The registration change, allowance release/reuse, staff update and audit commit atomically. A unique original-enrollment key prevents concurrent changes from creating duplicate successful updates. Failed swaps preserve the original booking and create no message. Overview and Calendar show a permission-filtered in-app Family booking updates inbox with Mark reviewed. External email/SMS delivery remains unconnected.

Familiar faces has separate Trainers and Horses sections. A family chooses the rider (automatic for one rider), then taps Favorite on a profile. Favorites save to that rider and appear in their profile; the existing three-per-category limit and ownership checks remain. New families do not need preferences to book.

## Architecture and data

No dependencies added. Calendar dates/layout and rider selection are pure domain helpers; calendar, balances, inbox and directory UI remain focused components. Booking-change persistence is separate from portal rendering. Server checks preserve tenant, ownership, booking policy, capacity and credit enforcement. Staff updates require schedule/customer visibility; acknowledgement additionally requires schedule management.

Migration: drizzle/0016_handy_shatterstar.sql adds booking_changes and its tenant/time index. It was applied successfully to local D1 after migrations 0000–0015. Hosted deployment applies configured migrations. No provider secrets or configuration are added. Existing payments are staff-recorded; Stripe is not connected.

Rollback: restore the preceding saved source/version. The new table is additive and can remain; do not drop it while preserving booking reasons. Older code will not display updates and does not require reasons. No existing session/allowance schema is rewritten.

## Validation

Mandatory release checks passed TypeScript, all 177 tests and the production build. A final production build passed after two wording-only adjustments. New coverage exercises calendar boundaries/navigation/overlap/filtering, rider defaults, atomic change reasons, failed/concurrent changes, tenant isolation and per-rider favorites. git diff --check passed.

Source review covers dropdown insets, control sizing, wrapping, modal use, mobile calendar scrolling, disabled/empty states, labels and focus styles. Browser screenshots, keyboard interaction, 200% zoom and 390/768/1440 viewport checks remain unverified: the managed preview refused connections with no evidence of recovery. No visual QA pass is claimed.

Baseline: Sites 1c0d2c75ec316b2a00ac5f1e428a8ab00110d261; GitHub 78c408429b2c89463ba669c9c3ce2d5fe456714b; saved version appgprj_6ae34a2858d8819195096b0a770fadce~appgver_c1bee03246008191b22ac0a10a3b239d. Publication IDs remain in Sites history; GitHub main is verified after sync. Owner-private access is preserved.
