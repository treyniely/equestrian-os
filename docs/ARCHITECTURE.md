# Architecture decision 001: first development slice

Status: implemented for owner-only development, not pilot-ready.

The current host is GPT Sites / Cloudflare Workers, so this release uses the supported Vinext React/TypeScript starter and D1. The original PostgreSQL/Supabase/Vercel proposal was not provisioned. Moving to that stack requires an explicit migration; this implementation does not pretend those services exist.

Boundaries: components/product handles UI; domain/scheduling.ts contains pure booking validation; app/api/workspace is the authenticated application boundary; db/schema.ts and immutable Drizzle migrations own persistence. API routes currently contain small persistence operations; extract repository services as more use cases arrive. Do not create speculative service layers.

Authentication uses trusted Sites identity headers. Each signed-in user currently owns an isolated development workspace keyed by user ID. This is NOT a complete academy membership model. Before staff/family access: introduce academy, membership, guardian/rider relationships and server-side role permissions; migrate ownership explicitly.

Booking duration is derived from the stored lesson, not browser input. A SQL trigger prevents overlapping rider/trainer/horse/arena reservations atomically. A unique tenant/request key protects identical retries. Cancel and audit writes are batched. This version supports private lessons only. Group slots require an explicit session/capacity model, not disabling resource protection.

Development scheduling uses explicit UTC and 08:00–18:00 availability. No local time inference. Next milestone must add IANA academy timezone, weekly hours, overrides, buffers, rest limits and suitability rules with DST tests. No production booking until these rules are implemented.

Money and payments are not implemented. Never treat a confirmed development booking as paid. Education, trial billing, email and SMS are roadmap features only. No academy website builder.

Source of truth: treyniely/equestrian-os on GitHub. Sites has a deployment mirror required by its publishing workflow. Upload the same reviewed source to both; verify GitHub commit and Sites deployment separately. No automatic continuous sync has been configured.

Dependency review: remove unused starter UI sources. Runtime currently retains starter package dependencies to preserve its verified toolchain; further dependency pruning should update and verify the lockfile. No additional application dependencies introduced.
