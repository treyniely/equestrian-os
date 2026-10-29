# 0.3.1 — Trainer dates off

Trainer profiles can add/remove individual full dates off alongside weekly availability. Dates are interpreted in the profile's IANA time zone. Shared availability checks block session creation, new registrations and resource suggestions on these dates. Existing lessons remain scheduled; the editor tells staff to review them before saving. This release does not automatically cancel sessions or message families.

Dates persist in existing resource JSON; no new dependencies or database migrations. Server validates real calendar dates and limits lists to 366 entries. Tests cover local dates across UTC boundaries, adjacent dates, persistence, session/registration rejection, invalid dates and restoring availability. Build and 27 tests passed. Authenticated browser QA remains pending due to unavailable managed preview.
