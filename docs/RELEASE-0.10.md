# Release 0.10 — Compact rider preferences and parent contact

Rider preference photos and initials now use 24px squares (previous maximum 96px) with names beside them in both admin and family portals. Selection controls retain their existing accessible target sizes.

Contact parent / guardian opens an in-place modal using the rider’s linked adult customer record. Call, Text and Email open device handlers. Copy email provides success feedback and a selectable-address fallback if clipboard access fails. Missing or invalid contact methods do not render launch actions. No messages are sent by EO; saved marketing preferences are unchanged. Existing communications permission and server-scoped customer visibility remain enforced.

Architecture: one focused contact component, shared preference styles, no new dependencies or data migration/configuration. Roll back by redeploying the previous saved Site version; no data reversal required.

Validation: TypeScript, complete 65-test suite, and production build. Source review includes long names/email wrapping, missing details, clipboard errors, 44px contact actions, modal close/Escape/focus restoration and small-screen wrapping. Browser QA remains unverified: previously confirmed managed preview route returns ERR_CONNECTION_REFUSED, with no infrastructure recovery evidence. Live native app handlers and clipboard behavior, mobile/tablet/desktop appearance, 200% zoom, and keyboard interaction remain pending browser verification per RELEASE-QA.md. Source inspection is not a visual pass.
