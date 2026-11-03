# Removed offering retention

Offering managers can permanently delete an unused removed offering after confirming. Existing sessions, bookings, plan inclusions and published plan snapshots protect referenced definitions from deletion. The check is part of the delete statement and scoped to the active academy.

The removal timestamp lives in the existing JSON details. Restore clears the timestamp. Older removed offerings receive a timestamp when an offering manager first opens the workspace. After 60 days, unused offerings are purged on the next authorized workspace load. No migration, background job or new dependency. Browser layout and interaction remain unverified.
