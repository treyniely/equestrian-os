# Release 0.13.1 — Persistent modal close and backdrop dismissal

All admin and family dialogs use the shared Dialog component. The title and 44px close button now sit in a non-scrolling header; only the body scrolls inside the viewport-bounded modal. Clicking/tapping the dark native backdrop closes the current dialog through its existing onClose handler, retaining the underlying page. Escape and focus restoration remain supported; focus restoration uses preventScroll.

Backdrop dismissal requires both a primary-pointer press and click outside the dialog bounds with the dialog as the event target. Interior/padding clicks, clicks from nested dialogs and drags beginning inside the form do not dismiss the parent. Native showModal retains focus containment. Closing discards unsaved form changes, consistent with the existing X/Escape action; no save/navigation is triggered. Existing cleanup handles canceled upload previews.

Architecture: one shared shell plus scoped header/body styles. No new dependencies, schema, configuration or per-screen copies. Rollback by redeploying the preceding version.

Validation: full check:release (TypeScript, all 91 tests, production build) and diff whitespace check. Source review covers header/body separation, 44px close target, mobile padding/title wrap, nested dialog event targets, pointer cancel/drag guard, Escape and focus restore. Browser visual/interaction QA remains unverified because managed preview last returned ERR_CONNECTION_REFUSED with no recovery evidence. Long-form scrolling, X/backdrop/touch/Escape, nested dialogs, zoom and 390/768/1440px layouts remain in the pending browser matrix. No visual-audit pass is claimed.


## Horse form simplification

Horse add/edit now contains only name, image, about and suitable rider levels; weekly availability/dates-off controls and card availability counts are removed. Horse-specific stored weekly schedules are ignored consistently by a shared withinResourceAvailability rule in admin/session validation, portal availability and suggestions. Saving a horse removes obsolete personal availability. Academy closures/hours, reservations/resource conflicts and rider suitability still apply. Trainers and interns retain personal schedules. New tests cover ignored legacy horse schedules, unchanged trainer/business closures, field persistence, family enrollment and reservation conflicts. No migration or dependency changes; old data is retained until profile save.

## Multiple guardian contact clarity

Contact parents / guardians now renders a separate card for each person, primary first, with their own grey name/relationship header, emergency badge, phone/email and direct actions. No contact selector hides the other adults. Copy-email state belongs to each card and accessible action names include the guardian’s name. Missing phone/email states remain explicit. Backup-contact summaries also show each person’s phone and email, and rider cards indicate the count of additional contacts. Existing saved contact objects, consent and permissions are unchanged.

Source QA includes long names/emails, multiple cards in the scrolling body, per-person copy fallback, missing contact methods and single-column small-screen methods. Actual browser interaction and visual verification remain pending under the preview limitation stated above.
