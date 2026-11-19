# EquestrianOS

Owner-only development workspace for lesson businesses and riding academies. Not production software; use fictional data.

## Current release
See docs/RELEASE-0.2.md for Lessons & Services, session registrations, customer management, manual memberships and communication drafts. All financial records are manual; messages are not sent.

Persistent resources, private lesson bookings, database-level conflict prevention, cancellation and audit history. Explicit UTC scheduling. Payments, family accounts, configurable hours, memberships, learning tools and live communications are not yet implemented.

See docs/ROADMAP.md and docs/ARCHITECTURE.md. Follow AGENTS.md before changes.

## Development
Use Node 24 and pnpm 11.25.0. Install dependencies from the committed lockfile and start the development server.

```sh
pnpm install --frozen-lockfile
npm run dev
```

The Sites runtime supplies authenticated identity; unauthenticated API requests return 401. Never introduce an authentication bypass into hosted code.

The [GitHub Actions release validation workflow](.github/workflows/release-validation.yml) uses the same Node and pnpm versions and frozen-lockfile install. After installing dependencies, run the same checks locally.

```sh
npm run check:release
python tests/database.py
```

The release script runs TypeScript checking, the TypeScript test suite, and the production build. The Python command separately tests database migrations. Follow the [release QA guide](docs/RELEASE-QA.md) for visual and interaction checks.

D1 schema migrations live in drizzle/. For local D1 setup, build first then run Wrangler against dist/server/wrangler.json with the migration file and local persistence. Hosted migrations are applied through the Sites packaging workflow.

Marketing source is retained in marketing/. The root application is the product. GitHub is the canonical source; Sites uses a separate deployment mirror. No GitHub-to-Sites automatic sync is configured.
