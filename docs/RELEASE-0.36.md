# 0.36 — Ready-made automations and persistent product reference

Baseline: version 73 / 63270fc20154b39867607aef806fac22adaaa0f4. Retains the entire 0.35 workflow/provider audit and targeted learning implementation.

- Communications shows prewritten personalized subject/body previews directly on every automation card, with trigger, channel, timing and preparation status. No empty-canvas setup is required.
- Completing essential academy setup persists the recommended settings atomically with onboarding completion. Existing saved choices are never overwritten. First-visit defaults remain visible for existing academies; existing completed accounts can save the recommended setup explicitly. Preparation is not dispatch activation.
- Product reference is a searchable permission-scoped admin tab, with a protected Markdown download. It retains the recovered core automation list, lifecycle ideas, product decisions and links to source documents. Source-controlled docs/PRODUCT-REFERENCE.md is generated from the same catalog. It is a maintained synthesis, not a complete reconstruction of chat history.
- Existing provider gates, operational/marketing consent separation, receipt-owner choice, queue/dispatch dependencies, and private audience remain unchanged. SMS is not enabled and no messages are sent. After provider integration, activation must only enqueue eligible future/current events, not replay historical events.

No schema migration, runtime secret or new dependency. Rollback can redeploy 0.35 without losing automation settings; keep its protected learning endpoint as documented in 0.35. The default initialization uses INSERT OR IGNORE to preserve customized rules and existing revisions. Source notes and recoverable ideas live in Git, independently of the transient Sites chat UI.

Verification: npm run check:release passed: 270 tests, zero failures, TypeScript and production build. The shared managed preview currently shows 0.35 and then ChatGPT sign-in; authenticated 0.36 visual checks at 390/768/1440, keyboard and zoom are unverified. Provider sandbox/delivery checks remain pending. No authentication was bypassed.
