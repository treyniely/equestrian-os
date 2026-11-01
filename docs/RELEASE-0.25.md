# Release 0.25 — Compact rider favorites

Favorite horses and preferred trainers each appear in a subtle light-gray panel. Each panel uses a two-column grid, with 24px square photos or initials and fully wrapping names. The third favorite begins the next row. Empty panels keep their existing message. The shared PreferenceTiles styling applies to both family rider cards and admin rider profiles, preserving consistent display without changing selection, storage or limits.

No new dependencies, schema, permissions or configuration. CSS rules were edited in place rather than layering competing overrides. Rollback restores the previous saved version; no data rollback is needed.

Validation: release checks passed TypeScript, all 177 tests and the production build. git diff --check passed. Source review covers grid min-width, wrapping long/unbroken names, fixed photo dimensions and matching panel padding. No new tests for this reversible presentation-only change. Browser preview previously refused connections and has no recovery evidence; visual screenshots, keyboard, 200% zoom and 390/768/1440 viewport verification remain incomplete. No visual QA pass is claimed.

Baseline: Sites 268c34aa291e6c94aa19f498a13f69687d32258b; GitHub 20a1ea50458642537ae333e931ca7119fca31344; saved version appgprj_6ae34a2858d8819195096b0a770fadce~appgver_94196a8c966c81919f31a904b82e5d50. Preserve owner-private access. Final publication identifiers are retained in Sites/GitHub history.
