# Release 0.30 — Private trainer preferences and upload-first horse records

## Team permissions

Team & Access now lists Trainer preferences with separate View and Manage flags. The Trainer and Intern presets default both off; owner/admin/manager presets include them. Existing stored grants that lack this new field default off, including existing custom admin/manager grants; the owner can explicitly enable access. Owner access is retained. Team management cannot grant beyond the acting manager’s own permissions.

Workspace response filtering removes both preferredTrainer and preferredTrainers from rider details when View is off. Cards, editors and scheduling helpers cannot see those values. View-only staff can inspect but cannot submit preference changes. Resource writes with either preference key require both rider management and trainer-preference management. Unrelated edits omit those keys and preserve saved preferences. The family portal still manages only its own riders’ choices. Responses are private/no-store; changed team permissions take effect on the next authenticated workspace request, and each write rechecks access. Already displayed pages are refreshed through normal workspace reload, not a new live revocation channel.

## Horse records

Add records accepts paperwork and/or pasted notes without a required category/date/provider form. Each file becomes a separate original record. A prominent search field searches original notes, filenames and manual details immediately. The connected adapter adds unverified summaries, categories, transcription, source quotes and explicit source dates for retrieval. Uploaded-on dates stay distinct from clinical dates. AI never sets saved follow-ups, clinical restrictions or lesson bookings.

Processing, metadata and retrieval use focused domain/server/provider modules with no new dependency. Source-change invalidation and processing lease tokens guard against stale results and overlapping requests. Failed organization keeps originals and supports retry. Search returns real scoped records (50 ranked matches maximum), never fabricated answers. Natural-language interpretation falls back to keyword/synonym retrieval on provider failure. See HORSE-HEALTH-DESIGN.md for configuration, provider data handling and limits.

The Site currently has no runtime API key. Document reading/AI interpretation are disabled and clearly labeled; notes/filenames/manual details remain searchable. No live model call or real document upload was used in QA. No secrets, provider data or customer data were added to Git.

## Validation and rollout

TypeScript, all 229 automated tests and production build passed. New tests cover preference redaction, independent view/manage, role defaults, legacy grants, permission escalation, revocation and preserving favorites during level edits; record intake retries, tenant/file scoping, source preservation, wrong patient handling, invalid quotations, processing races, query fallback, accurate dental filtering and structured provider payloads. git diff --check passed. The full migration chain through 0021 applied to fresh local D1 successfully. The first stdin-based migration invocation failed before successful fresh-file validation; no production data was used.

Migration 0021_strange_overlord adds horse_record_ai and an academy/horse index. No permissions migration is needed: grants normalize missing fields to false. Retain additive tables on rollback. Restore preceding source/version and keep original documents and metadata; disabling EO_RECORD_AI_ENABLED stops provider requests. No speculative libraries, new service or broad workspace payload expansion.

Source review covers matching dropdown insets, two-column filters, readable record/source blocks, overflow wrapping, upload keyboard focus, loading/error/retry states, reduced-motion spinner behavior and dialog reuse. Browser preview is still unavailable following earlier connection refusals with no recovery signal. Screenshots at 390/768/1440px, keyboard-only flows, 200% zoom, real R2 round trips and live model extraction remain unverified. This is not a passed visual audit. Marketing was not modified.

Baseline Sites source b139830d0cc4584b00194e3fb0ba40727a43ee2d; GitHub main aed18b602ebd808066a0a773153f7c6c9277fe98; saved version appgprj_6ae34a2858d8819195096b0a770fadce~appgver_b4fd31ee2fbc8191b9b8d1eec41a4991. Preserve owner-private audience. Exact publication SHAs/version are recorded by Sites and GitHub main is verified after sync.
