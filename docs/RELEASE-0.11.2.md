# Release 0.11.2 — Align logo tile with academy identity content

On side-by-side layouts, the logo square matches the height of the adjacent identity content from heading through CTA. It aligns to the top and preserves contain-fit artwork. A focused ResizeObserver tracks text wrapping, font size and content changes; it is disconnected on unmount. At 640px and below, the existing stacked layout uses a compact 96px square.

No new dependencies, persistence, schema or configuration changes. Existing upload and edit behavior is reused. Rollback by redeploying the preceding version.

Validation: full check:release (TypeScript, all 75 tests, production build) and diff whitespace check. Source inspection covers dynamic heading/CTA height, saved/empty logo, read-only without CTA, contained image proportions, and mobile stacking. Browser visual and interaction QA remains unverified because the managed preview connection last returned ERR_CONNECTION_REFUSED with no recovery evidence. This is not a visual-audit pass.
