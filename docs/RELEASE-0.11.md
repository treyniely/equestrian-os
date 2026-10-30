# Release 0.11 — Family onboarding, backup contacts and optional trainer reviews

## Delivered

Customers → Open family → Manage backup contacts and customer portal → Account share an editor for up to 10 additional parents/guardians/emergency contacts. Name, relationship, phone/email and emergency designation are saved once for all riders in that family. At least one contact method is required. Rider Contact parent / guardian includes a contact selector with Call, Text, Email and Copy email. Contacts do not receive login access, billing responsibility or marketing subscriptions. Changes use revision checks to reject stale overwrites.

Family Home shows a setup checklist before the first booking. Name-only rider creation remains possible; age group, riding experience and goals are optional, shared with staff. Staff control levels/groups. Trainer/horse preferences are explicitly optional and collapsed for new riders. The old duplicate add-first-rider panel was replaced by the checklist.

Academy setup → Trainer reviews has a single switch, default off. Off hides all portal review forms/content and rejects submissions/moderation. Enabling adds a trainer approval queue for staff with trainer-management permission. Families may submit one review per trainer after a past non-canceled booked lesson. This checks a booking record, not verified attendance. Editing a published review unpublishes it and sends it through approval again. Reviews appear in the trainer directory and rider preference editor after approval. Families see review content/rating only, without reviewer account identity. Feature disable retains rows for later re-enable; Hide review removes individual published reviews.

## Architecture and data

No new dependencies. Shared field/editor components, domain validation and focused persistence modules. Contacts are bounded JSON on the customer; rider intake uses existing resource details. Review table has tenant/family/trainer uniqueness and tenant/status lookup index. Queries return at most 200 review rows; admin prioritizes pending, public ratings describe recent reviews. Full historical paging/aggregate reporting, private feedback, attendance verification, additional guardian logins and rider-specific custody/pickup rules remain outside this release.

Server derives the family ID for portal writes; supplied customer IDs cannot target another family. Staff contact writes require customers manage, review moderation trainers manage, and feature toggle setup manage. Review writes/review moderation use optimistic revisions; family contact writes use optimistic revisions. Audits contain operation descriptions without contact or review text. Contact/review writes and subsequent audit inserts are separate statements; an audit-store failure can cause a saved change to require refresh, with revisions preventing blind overwrite.

Append-only generated migration 0009_normal_vector adds customer emergency_contacts (constant empty-array default), contacts_revision (zero), trainer_reviews and indexes. Sites applies migrations before Worker publication. No secrets/configuration changes. Roll back by redeploying the previous saved Site version, retaining additive schema/data; never drop these columns or reverse applied migration history.

## Validation

Full check:release: TypeScript, 75 tests, production build. New tests cover multi-contact round-trip/removal, own-family and tenant isolation, preserved consent/no login grants, stale writes, bounded validation, rider intake/level authority, default-off reviews, past/future/canceled booking eligibility, approval-only visibility, family edits returning to pending, stale moderation, hidden reviews and feature disable/re-enable. Whitespace diff check passed.

Source inspection covers 44px actions, modal close/focus behavior, shared select chevron padding, wrapped long names/messages, single-column mobile fields, empty/disabled/error/saved states, and removal of duplicate onboarding CTAs. Browser connection to exact managed preview URL http://terminal.local:4173/ returned ERR_CONNECTION_REFUSED after environment recovery. Therefore 390/768/1440px visual checks, 200% zoom, keyboard and device-handler/clipboard tests remain unverified. This is not an entire-site visual QA pass. Carry those cases into the next working browser session per RELEASE-QA.md.

Release source and deployment identifiers are recorded in GitHub and Sites version history; handoff reports the verified publication result.
