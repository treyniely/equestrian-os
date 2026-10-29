# 0.4.1 — Clear customer portal entry

The app root is the admin workspace. The prior handoff linked to that root, obscuring the separate customer page. A prominent Customer view link now opens /portal. That route resolves the selected owned/team academy or a joined family academy on the server when the academy query is omitted. Explicit academy signup links continue to work. Customer sign-in preserves the destination; sign-out returns to the family portal instead of the admin root. The customer header identifies the customer portal, and its missing-academy state no longer links parents into admin.

Legacy workspaces with saved riding spaces but no academy-name record now have a neutral academy-name fallback, removing the prior blocking Academy not found error. Arbitrary empty/missing academy identifiers remain rejected. No data migration or new dependencies. Portal entry resolution is a separate service and does not grant staff access; family data remains scoped by the existing account mapping.

Validation: TypeScript, 38 tests including selected academy resolution, unauthorized cookie fallback, joined-family routing and legacy unnamed academies; production build. Browser controls unavailable this session, so authenticated browser verification remains incomplete. Deployment stays owner-private. Rollback is code-only to the previous version; no schema changes.
