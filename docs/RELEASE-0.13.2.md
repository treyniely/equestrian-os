# Release 0.13.2 — Guardian relationships

Family portal signup/Account, backup/emergency contact editor and admin customer forms share a relationship dropdown: Mother, Father, Grandmother, Grandfather, Legal guardian, Aunt, Uncle, Stepparent, Foster parent, Sibling, Other relative, Family friend and Self (adult rider). Other reveals a required custom-description field. Existing free-text values remain available as custom values. Backup relationships remain required; primary relationship is optional for account compatibility.

Primary relationship persists with the customer and appears in the primary guardian contact header. Additional adults retain their own relationship fields. This does not grant access or alter consent, billing, rider levels or family/tenant boundaries. Updates omitting the primary relationship preserve its value.

Append-only generated migration 0010_fluffy_cloak adds customers.relationship with a constant empty-string default. Metadata/test fixtures include it; Sites applies it before Worker publication. No new dependencies/configuration. Roll back by redeploying the preceding version, retaining the additive column/data.

Validation: full check:release (TypeScript, 93 tests, production build) and diff whitespace check. New tests cover signup and admin/portal round-trip, legacy empty values, omitted-field preservation, tenant scoping, unchanged consent and maximum length. Source QA covers select insets, custom labels, required Other description, mobile wrapping and per-person display. Browser visual/interaction QA remains unverified: preview last returned ERR_CONNECTION_REFUSED with no recovery evidence. No visual pass is claimed.
