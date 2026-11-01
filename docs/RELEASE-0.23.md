# Release 0.23 — Clear payment choices and one optional horse

The offering form replaces the ambiguous payment dropdown with three visible radio cards. Each states a customer outcome and includes an explanation:

- Customers pay for each booking: set one lesson/event price; plans can also include this offering later.
- Customers need a plan or package: book using included sessions; set the plan price and quantity separately.
- Free for everyone: no payment or plan required.

Only per-booking offerings show a price input. Plan-only offerings explain the next step: save the offering, then add it to a plan/package and price that plan. Free offerings explain that no price is required. Member-only/free submissions save zero as the unused per-booking price; plan prices and previously purchased period snapshots are independent. The existing stored access values paid/membership/free and all booking/allowance enforcement remain unchanged. Cards also label plan-only offerings as Plan or package needed.

Scheduling an offering now uses one optional horse radio selection, including an explicit Assign later choice. Suggestions select at most one horse. The session endpoint rejects multiple initial horse selections before writing a session. Existing sessions and reservations are retained; assigning one horse per booked rider in a group remains a separate existing workflow. Horse favorites can still be multiple preferences. New coverage verifies multi-horse rejection without partial writes and successful single-horse reservation. The barn-planning fixture seeds a historical multi-horse reservation directly so preparation/absence tests still cover retained legacy records.

Implementation: one small offering-payment component owns selection and conditional form inputs. The existing parent submission and server endpoints are retained. No new dependency, schema, permission or provider changes. No new implementation-mirroring UI tests were added for this reversible form refinement.

Validation: mandatory release checks passed TypeScript, all 166 tests and the production build. git diff --check passed. Source review covers field grouping, complete clickable labels, radio keyboard semantics, text descriptions, selected state, conditional required price, hidden free/plan price, long text wrapping, responsive padding and focus indication. Browser screenshots, keyboard interaction, 200% zoom and viewport checks remain unverified because the managed browser preview most recently refused connections with no recovery evidence. No visual QA pass is claimed.

Baseline: Sites d181bc3b4f31700e9e55f7f908eee8d4d42e1020; GitHub 23c57d9164db21ece00507181b4070c6d8d7bce4; saved version appgprj_6ae34a2858d8819195096b0a770fadce~appgver_e5257024ac5481919185e87c5be67449. Exact publication identifiers are retained in Sites history and GitHub main is verified after sync. Preserve owner-private access. Rollback requires no schema change and restores the earlier dropdown. Marketing, payroll scope and payment-provider connectivity are unchanged.
