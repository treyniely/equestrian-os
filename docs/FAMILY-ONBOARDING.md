# Family onboarding and data ownership

| Data | Collected in portal | Stored/admin usage | Authority |
| --- | --- | --- | --- |
| Adult name, authenticated email, phone, adult attestation | Family signup/Account; phone optional | Customer account, guardian contact | Own family or authorized customer staff |
| Email/SMS preferences | Explicit signup choice and preferences editor | Consent-aware audiences | Family opt-in/out; staff can unsubscribe |
| Extra adults and emergency contacts | Account; optional, up to 10 | Family account and rider contact selector | Own family or customer-management staff; no login grant |
| Rider name | Add rider | Rider resource linked to customer | Own family/staff |
| Age group, experience, goals | Add/edit rider; optional | Rider card/editor and linked account context | Own family/staff |
| Riding level and group | Display only | Eligibility and segmentation | Academy staff only |
| Favorite horses/trainers | Optional, add later | Scheduling preference request | Own family/staff; availability/suitability still win |

The pre-booking checklist surfaces rider creation and optional contact completion. Customers can book without knowing a horse or trainer. The guide disappears after a booking is recorded. Age groups avoid collecting exact birth dates for this iteration. No medical data, waivers, pickup authority or identity-verification workflow is implied. Intake experience is self-reported and never changes the staff-assigned rider level.


Trainer reviews are excluded from the product. Families choose trainers using profiles, suitability and their own preferences.

Academy contact details are academy-managed business information. An optional GroupMe invitation appears on Home and Account only for confirmed adult family accounts when enabled by the academy. Joining is voluntary in GroupMe and does not change EO communication consent or synchronize chat content.

Plan allowances are assigned by billing-management staff to a rider or a shared family, using recorded paid-period snapshots. Families can view remaining sessions and book against them; they cannot grant or alter their own allowances. Legacy name-only memberships grant no unlimited entitlement. Monthly renewals are staff-recorded until verified Stripe billing is connected. See RELEASE-0.21.md.

Booking selects a sole rider automatically; multi-rider families choose before seeing sessions. Eligible allowance balances and period dates remain visible while booking. Cancellation/rescheduling requires a short reason shared in the academy’s in-app booking updates; no email/SMS delivery is implied. Familiar faces separates trainers/horses and saves favorites to the selected rider, matching profile preferences.
