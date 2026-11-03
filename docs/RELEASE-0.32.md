# Plan limits and scheduled events

Lessons & Offerings is the workspace navigation label. Allowance buckets can include optional per-offering limits. The total and each limit are enforced atomically by the enrollment trigger. New manual and Stripe-funded periods snapshot the limits. Existing periods keep their original benefits.

An event can publish one occurrence directly from the offering editor with an academy-local date, start/end times or an all-day setting. Calendar registrations are the admin roster. The family booking page groups upcoming events and accepts free RSVPs and bookings with eligible plan credits. Separately paid events show their price and direct families to the academy. One-time online checkout, payment holds and paid attendee reconciliation are pending.

Migration 0023 adds nullable maxima and replaces the balance view and credit trigger. Keep this migration in place when rolling back UI code. Reverting the migration would remove cap enforcement. No new dependencies. Responsive layout and browser interaction remain unverified.
