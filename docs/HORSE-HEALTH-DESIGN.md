# Horse health records — research and MVP

Reviewed November 1, 2026. The goal is finding a horse’s paperwork and care history quickly during ordinary lesson-barn work. EO already has horse identities, staff permissions, D1 records and private R2 document storage; a second software account is not required for this initial module.

## Primary product references

| Tool | Publicly documented pattern | EO decision |
| --- | --- | --- |
| BarnManager | Horse-linked PDFs/JPGs, notes, tags and search; calendar/reminder support | Put documents and searchable notes on the horse, not in a disconnected shared drive. |
| Stable Secretary | Categorized vet/health records, provider names, next due dates, health history and due-date reports | Use familiar care categories and a clear due list. |
| Stable Manager | Per-horse vaccine dates/notes and imminent/overdue badges, with configurable intervals | Make due status visible, but have the barn/veterinarian supply dates rather than inventing clinical schedules. |

Sources: https://www.barnmanager.com/digital-vet-records/ (published August 14, 2020); https://stablesecretary.com/support-add-records/ ; https://stablesecretary.com/support-reports/ ; https://www.stables.cloud/horse_vaccines . These are product descriptions, not clinical protocols or claims of parity with their full products.

## Implemented MVP

Horses → Health & care records opens a horse-specific history. Add a completed care record with category, date, title, provider, notes, optional next due date and up to five documents. Categories: vet visit, vaccination, dental, farrier, deworming, medication, test/Coggins, injury/recovery and other care. No clinical interval, treatment, dosage or clearance is generated. Future appointments and treatment administration workflows are not represented as completed visits automatically.

The UI searches title/provider/notes, filters category and archive state, paginates history in 50-record cursor pages and shows the next 20 unresolved manually entered follow-ups. Follow-up complete clears its due cue while retaining the historical record. Archive is reversible. Notes/documents expand inside an individual record. All health data remains staff-only, under existing horse view/manage grants. The customer directory does not receive it.

PDF/JPEG/PNG/WebP uploads are restricted to 8 MB per file, validated against content signatures and served as authenticated downloads with no public URLs. Files must belong to the same academy and horse before linking to a record; unsigned URL guesses do not grant access. Read/download routes validate identity, tenant and horse access. No iframe/document execution or public sharing is provided. File signatures are not antivirus scanning. Unattached uploads from abandoned/failed records can remain and need a future retention cleanup policy; clinical documents must never be deleted by a cleanup without checking references.

Metadata lives in focused horse_health_records/horse_health_files tables. R2 keys are academy/horse scoped. Health routes load records separately from the full workspace. Optimistic revision guards prevent silent overwrite; edits/archive/restores are audited with the authenticated staff identity. Signed documents are not ingested into an AI model. This is a recordkeeping feature, not a veterinary practice system.

## Next increments

1. Barn-wide due dashboard and optional notifications through the future connected messaging provider, with explicit reminder preferences.
2. Multi-horse logging for visits involving several horses, with per-horse review to avoid duplicate/incorrect entries.
3. Staff-reviewed PDF export and explicit sharing with a veterinarian; no public-by-default health links.
4. Primary vet/farrier contacts and provider directory.
5. Optional document extraction that suggests fields and requires staff verification before saving. Never automatically prescribe treatments or set medication restrictions.

Health records do not currently block lesson bookings or create intern medication tasks. Any future unfit-to-ride flag, clinical restrictions or medication administration process requires separate product rules, authorized instructions and audit controls. No external equine-software import, clinic sync, OCR, outbound reminders or clinical claims are included in this release.
