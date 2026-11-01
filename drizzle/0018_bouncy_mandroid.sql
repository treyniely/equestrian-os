CREATE TABLE `subscription_catalogs` (
	`binding` text NOT NULL,
	`catalog` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_catalog_once` ON `subscription_catalogs` (`binding`,`catalog`);--> statement-breakpoint
ALTER TABLE `rider_subscriptions` ADD `next_catalog` text;--> statement-breakpoint
ALTER TABLE `rider_subscriptions` ADD `schedule` text;
--> statement-breakpoint
CREATE TRIGGER rider_checkout_existing_period BEFORE INSERT ON rider_subscriptions BEGIN
 SELECT RAISE(ABORT,'existing_paid_rider_period') WHERE EXISTS(
  SELECT 1 FROM benefit_periods p JOIN memberships m ON m.id=p.membership AND m.tenant=p.tenant
  WHERE p.tenant=NEW.tenant AND p.rider=NEW.rider AND p.end>CAST(strftime('%s','now') AS INTEGER)*1000 AND m.status='active'
 );
END;
--> statement-breakpoint
CREATE TRIGGER manual_period_online_rider BEFORE INSERT ON benefit_periods BEGIN
 SELECT RAISE(ABORT,'online_subscription_manages_period') WHERE NEW.rider IS NOT NULL AND EXISTS(
  SELECT 1 FROM rider_subscriptions s WHERE s.tenant=NEW.tenant AND s.rider=NEW.rider AND s.id<>NEW.membership AND s.status NOT IN ('canceled','incomplete_expired')
 );
END;
