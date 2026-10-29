# EquestrianOS

Owner-only development workspace for lesson businesses and riding academies. Not production software; use fictional data.

## Current release
Persistent resources, private lesson bookings, database-level conflict prevention, cancellation and audit history. Explicit UTC scheduling. Payments, family accounts, configurable hours, memberships, learning tools and live communications are not yet implemented.

See docs/ROADMAP.md and docs/ARCHITECTURE.md. Follow AGENTS.md before changes.

## Development
Node 24; install with `node scripts/install-ci.mjs` using the retained lockfile/toolchain. Run `npm run dev`. The Sites runtime supplies authenticated identity; unauthenticated API requests return 401. Never introduce an authentication bypass into hosted code.

Checks: `npx tsc --noEmit`, `node --experimental-strip-types --test tests/scheduling.test.ts`, `python tests/database.py`, `npm run build`.

D1 schema migrations live in drizzle/. For local D1 setup, build first then run Wrangler against dist/server/wrangler.json with the migration file and local persistence. Hosted migrations are applied through the Sites packaging workflow.

Marketing source is retained in marketing/. The root application is the product. GitHub is the canonical source; Sites uses a separate deployment mirror. No GitHub-to-Sites automatic sync is configured.
