# 0.2.1 — Simpler setup

- Replace duplicated setup checklists with one shared component and the same saved completion state.
- Center the completion icon; scope automatic SVG margins to the row chevron rather than every nested last-child SVG.
- Add explicit green Complete labels, a completion count, and one Next step indicator. Status is expressed with text and an icon as well as color.
- Remove the duplicate black offering promotion and its unused layout/style rules. The checklist occupies the full available width.
- Unfinished setup steps open the relevant creation form directly. Completed steps open their management view. Add the first scheduled session as the final setup step.
- No backend/schema changes or new dependencies. Existing records retained.

Validation: TypeScript and production build. Shared checklist rendered with representative partial progress for markup QA. Browser visual QA could not run because the managed preview URL refused the browser connection; no authentication bypass or preview-specific code was shipped.
