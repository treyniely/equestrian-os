# Event class pricing

Events can use one event price or up to 100 named, individually priced classes. An optional discounted unlimited pass covers the full list. The academy saves pricing in existing offering details, and archived details and relaunch retain it. Families can compare selections and totals in the portal. Paid checkout and per-class registration and rosters are pending. Class-priced events cannot use ordinary online booking or be added to new plans. No schema or dependency change. Browser interaction remains unverified.

Class entry and pass price fields show a fixed dollar prefix alongside the editable numeric amount. No schema or dependency change.

Currency fields reserve a 32 px leading inset through the shared dialog input rule so the numeric caret and value clear the dollar prefix.

The optional unlimited pass now has a separate section before individual class pricing. Its price appears when enabled, and the unlimited pass label is consistent across the editor and family preview.

Event capacity can be unlimited. A positive integer sentinel works with existing database booking guards and requires no migration. Changing an event offering's capacity updates its future scheduled sessions and keeps existing bookings. Customer availability and staff views show a readable unlimited state. No new configuration is required. Before rolling back to code without unlimited-capacity rendering, restore finite capacities for unlimited offerings and their scheduled sessions.

Event creation and relaunch now use the same date picker with a month calendar and direct date entry. All-day events require a start time in the form and end at local midnight. Existing midnight-start records and earlier request payloads retain their existing semantics. The picker uses an existing dependency and needs no migration or configuration.
