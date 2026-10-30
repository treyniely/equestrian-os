# Release QA standard

Run `npm run check:release` for TypeScript, the complete domain/authorization/SQLite suite and production build. Do not treat passing code checks as evidence that the UI was visually reviewed.

Every release must record exact source commit, deployment result, automated checks, screens/viewport sizes reviewed, screenshots when available, and any unverified items. Use fictional records in isolated staging; never alter audience, bypass authentication or create real family/payment records for QA.

## Visual and interaction matrix

Review at 390px mobile, 768px tablet and 1440px desktop, plus keyboard-only navigation and 200% zoom. Inspect the affected flow and the shared controls it uses across both admin and customer experiences.

- Admin: overview/onboarding, academy switcher, calendar/create session/details, customers/account editing, programs, horse/trainer/rider profiles, academy name/logo/hours/branding, team invitations/roles.
- Customer: signup, Home, Book filters/confirmation/reschedule/cancel, rider profile/favorites/directory, Account.
- Marketing: navigation, hero, CTA/demo/trial forms, pricing/FAQ/footer in the separate marketing deployment. Source in this repository does not prove that live marketing deployment was checked.
- Controls: matching left/right insets, chevron space, label/input gaps, full-width fields, checkbox alignment, date/time sizing, button height, dialog close clearance, responsive rows/cards, scroll containment and long names/emails.
- States: loading, empty, populated, disabled, error, saved/complete, keyboard focus and destructive confirmation. Verify selected academy isolation and accessible contrast for custom colors.
- Scheduling: multiple individual dates, cross-month range, overlapping selection, removing dates/ranges, pending range indication, one final save, business closures and personal hours, existing booking retention.

If browser preview is unavailable, capture the concrete failure once and disclose visual QA as incomplete. Continue safe code fixes and checks when authorized, but never report an entire-site visual audit as passed. Do not ask the user to become the default QA process. Carry the unverified matrix into the next available browser session.

## Current source audit

Admin and portal selects now share one chevron/padding rule; portal-only fixes were removed. Dialog input/select/textarea spacing, checkbox sizes, close-button clearance, small-screen input fonts and wrapping action rows were reviewed in source. The availability editor now has shared page/dialog styles rather than depending on dialog ancestors. These source changes are not a substitute for the viewport matrix above. Browser preview continues to refuse connections in this environment; visual audit remains pending. Marketing's separate live deployment was not changed or visually audited in this release.
