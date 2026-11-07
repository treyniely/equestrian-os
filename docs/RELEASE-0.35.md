# 0.35 — Provider-aligned setup, communications and targeted learning

Baseline Sites source: a1b0cfc95c990e7381a82ca4d1ac89941d420e19. See WORKFLOW-AUDIT-0.35.md for every-tab evidence and gap actions; PROVIDER-SETUP.md for official provider contracts and low-cost development options.

## Changes

Dedicated Communications navigation and saved per-academy recipe preparation, channel/copy/timing previews, one receipt owner, SMS estimates and reviewed campaigns. Targeted library drafts/edit/publish with private MP4/PDF uploads, video embeds, search, per-rider family views and guardian-deduplicated announcement drafts. Separate portal lesson/schedule consent with channel/purpose/source/wording/timestamp history. Service readiness and documented setup reviews in Overview, Academy setup and Barn team, plus learning/communications optional onboarding steps. Core booking, credit, plans, payroll approval/export and existing records retained.

## Persistence and rollback

No schema migration, package addition or provider credentials required. New resource kinds: learning (existing, enriched backward-compatible details), communication-settings, communication-consent, communication-consent-event, integration-setup. Internal kinds never enter the generic permission-filtered workspace response. New learning files use unique private bucket keys, with legacy PDF fallback. Resource/audit writes commit atomically before old-asset cleanup. Stale edits fail without replacing current content. Draft and preference records survive rollback; do not deploy the old academy-wide learning endpoint after using restricted audiences, because it does not enforce targeting. If rollback is necessary, temporarily disable library family access or retain the new protected endpoint.

## Configuration and remaining dependencies

All settings, upload/read APIs and previews are application functionality. No provider delivery or payroll transfers are enabled. Optimized Cloudflare Stream, Twilio/SendGrid dispatch/registration/callbacks and Gusto Embedded remain unconnected; service setup previews say so. Existing Stripe OAuth and billing code stay gated by their existing runtime configuration. Embedded account migration and all provider sandbox verification remain pending. Sensitive provider information is never requested in these local previews.

Development MP4 uploads use existing private object storage, not Cloudflare Stream, and are capped at 25 MB. PDFs remain capped at 10 MB. This gives a working upload/review/audience flow without a new video account, but it is not a production adaptive-video or cost-metering implementation. Native app delivery, event paid checkout, durable notification queues and advanced course progression remain separate work.

## Release verification

Run npm run check:release for exact final suite/build results. Final combined pass: 269 tests, zero failures, TypeScript and production build passed. Source/deployment identifiers are recorded in the release handoff. Follow-up cases include atomic upload rollback and campaign draft management.

Browser: managed preview reached ChatGPT sign-in. Authenticated visual checks at 390/768/1440 widths, 200% zoom, keyboard flow, hover/spacing and playback are not verified. No provider sandbox transactions or messages were attempted; no paid plan was purchased; access configuration stays unchanged.
