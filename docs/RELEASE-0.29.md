# Release 0.29 — Scheduling Undo, adult accounts, message review and horse care

## Scheduling

A live single-session or monthly publish returns an ephemeral Undo receipt only on the successful write response. Workspace shows a compact bottom-right notification for five seconds, then a 250ms fade. It is not persisted or reconstructed on reload. Replacing a toast cancels its timers; returning from a hidden tab after expiry dismisses it. Reduced-motion preferences remove the transition. The persistent draft Undo buttons and duplicate schedule-save banners are removed; draft editing/removal remain available.

Undo is schedule-management protected and scoped to one receipt/academy. A short 15-second server grace window permits an in-flight click after the five-second UI window. Receipt validation and deletion are atomic; database guards block any action with enrollments, family change history, started/completed barn tasks, canceled/changed sessions or an expired receipt. No partial bulk Undo. Only that action’s unused sessions, reservations, related planning artifacts and unsent launch draft are removed. Announcement Undo additionally requires the original communication/customer permissions. Replay tombstones prevent a retry from republishing undone sessions. Repeated Undo is idempotent.

## Customers and messages

Admin entry now says Add adult customer. The creation modal explicitly separates Adult customer → Add riders, labels the adult’s name/attestation clearly and opens the created adult’s account instead of closing. Add rider reuses the existing profile editor, with the adult link preselected and locked in this context. Existing customer Manage also offers Add rider. No customer is automatically created as a rider or opted into marketing.

Message drafting now moves to Preview message before saving. It previews email subject/body or SMS text, channel, rule delay if relevant, recipient counts/names/contact details and flagged/excluded contacts. Staff can search/remove/restore recipients and go Back/Edit without losing content. The final action is Save reviewed draft; delivery remains unconnected. Subject is retained in audience metadata. Server-side eligibility/consent is rechecked before saving. Preview styling is illustrative until a real delivery provider is integrated; it is not a test send.

## Horse health

Research-led horse care history, notes, manually entered next-due/follow-up tracking, category/search filters, bounded history pagination, reversible archive and authenticated PDF/photo attachments are available from each horse card. Existing horse permissions protect view/manage and customer responses exclude these records. No automated veterinary intervals, medication advice, clinic integration or outbound reminders. See HORSE-HEALTH-DESIGN.md for primary sources, scope, security and next increments.

## Architecture and validation

No dependencies or provider configuration added. Migration 0019_lyrical_guardian adds scheduling receipts/idempotency and atomic-use guards. Migration 0020_big_masque adds horse records/document metadata and revision protection. Private R2 uses the existing binding. Health APIs load separately from workspace; user-facing preview and adult/rider setup reuse existing services and components. Save gained an optional response callback to keep new-account navigation tied to the successful server result.

Validation: mandatory checks passed TypeScript, all 217 tests and the production build. git diff --check passed. The complete migration chain through 0020 applied to fresh local D1 successfully (113 commands), including the Undo and revision guards. Tests cover Undo scope/retry/expiry/booked races, whole-batch atomicity, record isolation/attachments/revisions/archive/pagination, adult/rider separation, reviewed subject persistence and revoked consent. Source review covers toast size/timing/focus, modal close/back controls, responsive previews, fixed recipient/record scroll areas, long names/filenames, badges, dropdown insets, disabled/error states and attachment handling. Browser preview remains unavailable after prior connection refusals with no recovery evidence. Screenshots at 390/768/1440, keyboard-only flow and 200% zoom remain unverified; no visual or actual R2 browser round-trip pass is claimed.

Rollback: restore preceding source/version, keep additive tables and private documents. Receipts are short-lived UI opportunities but retained as retry tombstones. Never drop records/attachments on rollback. Stripe remains disabled and messaging remains draft-only. Baseline Sites 1dd9052c4b7cc171ccbbd85e3ce31b3b794768ee; GitHub 4064855e0f373e9d2c76db99b7d78cc622110703; saved version appgprj_6ae34a2858d8819195096b0a770fadce~appgver_b5a11e8e1d88819188948d0a7e9e7f99. Preserve owner-private access. Exact new commits/deployment are stored in publication history and GitHub main is verified after sync.
