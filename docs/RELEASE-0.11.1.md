# Release 0.11.1 — Restore visible academy logo setup

The existing logo uploader was reachable only through Add name in the academy language section. Academy setup now starts with an explicit Academy name & logo card, showing the saved logo or a grey placeholder and Add your logo / Edit name & logo action. The existing 1080px fitting/upload workflow opens in the same shared dialog. Portal color controls follow the identity card so saved-logo palette suggestions are nearby. The duplicate academy name entry was removed from language settings.

Presentation-only architecture: one small identity component and scoped responsive styles; existing tenant/permission-checked photo and academy save paths are reused. No dependency, schema or configuration changes. Rollback by redeploying the previous version.

Validation: check:release (TypeScript, all 75 tests, production build) and diff whitespace checks. Source inspection covers empty/saved logo, read-only permissions, 44px action, long names, mobile stacking, contain-fit images, shared dialog close/field spacing and unchanged upload preparation/error states. Browser visual/interaction QA remains unverified: managed preview last returned ERR_CONNECTION_REFUSED and there is no infrastructure recovery evidence. This release does not claim a passed visual audit.
