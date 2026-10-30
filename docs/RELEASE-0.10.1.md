# Release 0.10.1 — Parent contact hierarchy

The parent name now sits in a subtle neutral-grey header card at the top of the contact modal, with a small person icon and Parent / guardian label. Phone and email remain separate white action sections. The header uses 18px padding, a 12px gap and wrapping names; action targets and modal behavior are unchanged.

Architecture: scoped presentation-only changes, no dependencies, schema migrations or configuration. Rollback: redeploy the previous saved Site version.

Validation: full check:release (TypeScript, 65 tests, production build); source review of narrow-width wrapping, close clearance and shared control spacing. Browser preview previously returned ERR_CONNECTION_REFUSED with no recovery evidence. Desktop/mobile/tablet visual appearance, 200% zoom and keyboard interaction remain unverified per RELEASE-QA.md.
