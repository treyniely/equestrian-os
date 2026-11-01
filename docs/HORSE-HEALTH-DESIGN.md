# Horse health records — research and MVP

Reviewed November 1, 2026. The goal is finding a horse’s paperwork and care history quickly during ordinary lesson-barn work. EO already has horse identities, staff permissions, D1 records and private R2 document storage; a second software account is not required for this initial module.

## Primary product references

| Tool | Publicly documented pattern | EO decision |
| --- | --- | --- |
| BarnManager | Horse-linked PDFs/JPGs, notes, tags and search; calendar/reminder support | Put documents and searchable notes on the horse, not in a disconnected shared drive. |
| Stable Secretary | Categorized vet/health records, provider names, next due dates, health history and due-date reports | Use familiar care categories and a clear due list. |
| Stable Manager | Per-horse vaccine dates/notes and imminent/overdue badges, with configurable intervals | Make due status visible, but have the barn/veterinarian supply dates rather than inventing clinical schedules. |

Sources: https://www.barnmanager.com/digital-vet-records/ (published August 14, 2020); https://stablesecretary.com/support-add-records/ ; https://stablesecretary.com/support-reports/ ; https://www.stables.cloud/horse_vaccines . These are product descriptions, not clinical protocols or claims of parity with their full products.

## Original recordkeeping foundation (0.29)

Horses → Health & care records opens a horse-specific history. Add a completed care record with category, date, title, provider, notes, optional next due date and up to five documents. Categories: vet visit, vaccination, dental, farrier, deworming, medication, test/Coggins, injury/recovery and other care. No clinical interval, treatment, dosage or clearance is generated. Future appointments and treatment administration workflows are not represented as completed visits automatically.

The UI searches title/provider/notes, filters category and archive state, paginates history in 50-record cursor pages and shows the next 20 unresolved manually entered follow-ups. Follow-up complete clears its due cue while retaining the historical record. Archive is reversible. Notes/documents expand inside an individual record. All health data remains staff-only, under existing horse view/manage grants. The customer directory does not receive it.

PDF/JPEG/PNG/WebP uploads are restricted to 8 MB per file, validated against content signatures and served as authenticated downloads with no public URLs. Files must belong to the same academy and horse before linking to a record; unsigned URL guesses do not grant access. Read/download routes validate identity, tenant and horse access. No iframe/document execution or public sharing is provided. File signatures are not antivirus scanning. Unattached uploads from abandoned/failed records can remain and need a future retention cleanup policy; clinical documents must never be deleted by a cleanup without checking references.

Metadata lives in focused horse_health_records/horse_health_files tables. R2 keys are academy/horse scoped. Health routes load records separately from the full workspace. Optimistic revision guards prevent silent overwrite; edits/archive/restores are audited with the authenticated staff identity. In 0.29, documents were not sent to an AI model; 0.30 adds the opt-in server-configured adapter described below. This is a recordkeeping feature, not a veterinary practice system.

## Next increments

1. Barn-wide due dashboard and optional notifications through the future connected messaging provider, with explicit reminder preferences.
2. Multi-horse logging for visits involving several horses, with per-horse review to avoid duplicate/incorrect entries.
3. Staff-reviewed PDF export and explicit sharing with a veterinarian; no public-by-default health links.
4. Primary vet/farrier contacts and provider directory.
5. Optional document extraction is implemented in 0.30 but remains disabled until provider credentials are configured.

Health records do not currently block lesson bookings or create intern medication tasks. Any future unfit-to-ride flag, clinical restrictions or medication administration process requires separate product rules, authorized instructions and audit controls. No external equine-software import, clinic sync, outbound reminders or clinical claims are included.


## Upload-first organization and search (0.30)

The primary Add records flow asks only for documents and/or pasted notes. Each file is its own searchable record; an intake accepts five files of up to 8 MB each. Upload dates are explicitly Added dates, never assumed care dates. Original documents and notes remain available. Detailed manual editing and entered follow-ups remain secondary.

A separate provider adapter uses the OpenAI Responses API with strict structured output, base64 PDF/image inputs, no tools and store:false. All source text is treated as untrusted data. The adapter generates unverified indexing metadata (title, summary, category, explicit dates/provider, tags, transcription and short source quotations). No diagnosis, dosage, clinical schedule, booking restriction or intern task is generated. AI dates do not populate saved follow-up fields. Wrong-patient outputs suppress extracted clinical details. Quotation IDs must match the attached source and quotes must occur in the extracted transcription (or original pasted notes). This is a consistency check, not proof of transcription accuracy; originals remain authoritative.

Existing horse view/manage grants protect records, processing and file downloads. Model requests contain only the selected horse name, that record’s notes and one source file at a time. Metadata lives separately in horse_record_ai. Processing uses a five-minute lease token and source-content checks; source edits invalidate metadata and prevent late results overwriting newer input. Failures preserve originals with a retry action. Source text remains staff-only. Extraction has a 45-second timeout per file; browser interruption can require a later retry. There is no background queue, bulk backfill, malware scanner, embedding service or automatic document retention cleanup.

Search is scoped by the indexed academy/horse columns and returns actual records, not generated factual answers. It searches notes, original filenames, manual fields and successfully extracted text. Keywords/synonyms work without AI. When connected, a validated query rewrite adds natural-language terms and explicit date ranges; provider failures fall back to local keywords. Terms and dates are bound SQL values, never executable model SQL. Date-range searches on intake records require an extracted care date. Searches return up to 50 ranked matches with a refine prompt; unfiltered history retains cursor pagination. This bounded per-horse approach avoids a separate search service; larger barn-wide retrieval needs measured indexing work.

### Configuration

No key is configured in the current Site. Store OPENAI_API_KEY as a secret runtime variable through Sites, and set EO_RECORD_AI_ENABLED=true only when the academy is ready to process its selected documents. Optional OPENAI_RECORD_MODEL defaults to gpt-4.1-mini. Never place a key in source or browser variables. Deploy a saved version after changing runtime configuration. Until connected, UI says that originals/notes are saved and document contents are not searchable. Existing records can be organized individually later. store:false does not itself promise zero provider retention; review the provider’s data controls for the deployment.

API references: https://developers.openai.com/api/docs/guides/file-inputs ; https://developers.openai.com/api/docs/guides/structured-outputs ; https://developers.openai.com/api/docs/models/gpt-4.1-mini . No live paid provider call was performed in this release; adapter behavior is tested with mocked responses.
