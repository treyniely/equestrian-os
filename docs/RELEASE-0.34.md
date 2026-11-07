# Quick booking and Learning Library

Day and week calendar hour slots open scheduling at the selected date and time. The schedule dialog searches offerings and riders. A selected rider is enrolled in the same database batch as the new session and its reservations. Members-only offerings require an eligible credit. This action records a reservation and does not charge a card. Existing session-only scheduling and its undo stay available.

Staff with offering management can publish HTTPS video links and upload PDFs up to 10 MB. Files are private objects and require authenticated academy access. Published resources are available academy-wide. Native video uploads, targeted sharing, progression requirements and saved-card charging are future work.

No new schema, bindings, credentials or dependencies. Resources use existing D1 records and private object storage. A rollback preserves published learning resources. Browser verification is separate from the automated release suite.

The admin calendar shows the academy identity and uses the same contrast-adjusted palette as the family portal. Add controls use a 44 px button, a visible border and a heavier plus. Offering colors remain semantic. No schema or dependency change.

Calendar grid surfaces and controls use light gray. Academy color is limited to the header and active view control. Each day keeps a compact borderless add button. Calendar controls have hover and focus states, and workspace headings use the page name directly. No migration or configuration change.

Customer creation now leads with identity and contact information, with secondary fields in a disclosure. Customer overview prioritizes riders, retains the contact summary, and uses plain-text account status. Marketing consent remains visible under Account details and retains existing opt-in rules. No data migration or permission change.

Rider levels support academy-defined names, palette colors, and icons. Existing names remain stable to preserve name-based rider and trainer assignments. Appearance is stored in existing resource details and applies across admin and family views. Customer and billing badges share the dot treatment. Card expired is a manually recorded billing status and does not imply a live Stripe feed. No schema change.

Inactive accounts now appear in Customers → Needs attention, including accounts with no billing record. Audience previews using the same segment reflect the same accounts and retain consent checks. The selected calendar view uses white text on the contrast-adjusted academy accent, including on hover. No schema change.

Rider-level badge colors and icons now use visual selections styled like the event color palette. Icon choices expand in place and both selections update the existing live badge preview. No schema or configuration change.

Quick scheduling now uses a plain offering selector. Rider search includes New rider for staff with rider management. A name creates a Beginner rider and booking together in the existing transaction. The profile can later be linked to an adult customer. Members-only offerings still require eligible credits, so unlinked new riders cannot use those offerings. Failed or retried bookings do not create orphaned or duplicate rider records. No schema or configuration changes.
