# EquestrianOS development standards

GitHub treyniely/equestrian-os is the product source of truth. Commit every build and document deployment commits. Never report a GitHub sync without verifying it.

Build a modular application with separate UI, domain rules, persistence, and external provider adapters. Prefer a small dependency footprint. Remove dead code and avoid speculative abstractions or microservices.

Server-enforce identity, tenant isolation, role permissions, rider/guardian access, resource conflicts, suitability, and payment status. Never trust tenant or role identifiers from a browser. AI uses these same APIs and requires previews for consequential actions.

Booking operations must be atomic, retry-safe, and prevent concurrent resource conflicts. Use UTC instants plus academy IANA time zones; model local operating hours separately. Money uses integer minor units and explicit currencies. Verify provider webhooks and deduplicate events.

Every release: review architectural boundaries and dependency growth; run relevant domain, authorization, concurrency, and build checks; document schema migrations, configuration, rollback, and incomplete features. Never label demo data or unconnected payments as production functionality. Do not store secrets or real customer data in Git.

Scope: lesson businesses and riding academies; responsive admin and family portals first; 14-day guided trial; rider education included; academy website builder excluded. Maintain requirements and architecture decisions in docs/.
