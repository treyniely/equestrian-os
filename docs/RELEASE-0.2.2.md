# 0.2.2 — Profiles, rider preferences and horse planning

## Delivered
Editable trainer photo/bio and horse photo/description. Images upload to authenticated tenant-scoped R2 storage; client resizes/re-encodes to WebP and server limits size and validates supported file signatures. Photo reads require identity and never accept arbitrary bucket paths. Profiles remain in the resources JSON structure, preserving IDs and existing bookings.

Riders can have up to three preferred horses and one preferred instructor, managed by the academy until guardian authentication/permissions are built. Favorites are soft preferences, not guaranteed assignments. Foreign resource references are rejected server-side.

Calendar planning can use a rider's preferences to suggest an available instructor and eligible horses. Favorites take priority among eligible horses, followed by lower scheduled work. Suggestions fill resource choices only; staff review and schedule. Enrollment remains a separate step. No unsupervised assignment or automatic customer communications.

Horse daily work caps and rest buffers are academy-configured, not medical recommendations. Unconfigured caps remain explicitly unset. All scheduled horse reservations count conservatively, including unmounted sessions and legacy private bookings; canceled sessions do not count. Work is measured in minutes per UTC schedule day in this development release. Database trigger 0002 enforces caps and rest atomically on reservation insertion. Profile changes never silently cancel existing sessions; over-limit existing work is visible on cards.

## Architecture and validation
No new dependencies. Shared pure planning and photo-validation modules; profile UI separate from workspace shell. R2 binding BUCKET added; existing D1 migrations 0000/0001 unchanged, append-only custom migration 0002 adds reservation guards. Existing GitHub/Sites histories reconciled without overwriting either. Shell execution permissions restored after source recovery.

TypeScript, production build, and 24 domain/database checks. Photo storage still requires authenticated end-to-end upload verification in staging. Family portal, custom rider-to-horse suitability matrix, individual horse-to-rider assignments for mounted groups, weekly limits and local-time schedule days remain future work. This release remains a private development environment using fictional data.

No payment, billing or delivery integration changes. Unreferenced uploaded photos are not automatically deleted; retention cleanup must be designed before public launch. Storage failure leaves the form available for retry; a failed upload does not write a profile.
