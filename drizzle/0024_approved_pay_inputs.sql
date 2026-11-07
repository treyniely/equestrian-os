CREATE TABLE `pay_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`snapshot` text NOT NULL,
	`actor` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pay_export_period` ON `pay_exports` (`tenant`,`start`,`end`);--> statement-breakpoint
CREATE TABLE `work_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`entry` text NOT NULL,
	`actor` text NOT NULL,
	`created` integer NOT NULL,
	`snapshot` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`staff` text NOT NULL,
	`day` text NOT NULL,
	`minutes` integer NOT NULL,
	`lessons` integer NOT NULL,
	`note` text NOT NULL,
	`approved_by` text,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `work_entry_period` ON `work_entries` (`tenant`,`day`);
--> statement-breakpoint
CREATE TRIGGER work_entry_insert_lock BEFORE INSERT ON work_entries
WHEN EXISTS (SELECT 1 FROM pay_exports WHERE tenant=NEW.tenant AND NEW.day BETWEEN start AND end)
BEGIN SELECT RAISE(ABORT,'pay_period_locked'); END;
--> statement-breakpoint
CREATE TRIGGER work_entry_update_lock BEFORE UPDATE ON work_entries
WHEN EXISTS (SELECT 1 FROM pay_exports WHERE tenant=OLD.tenant AND (OLD.day BETWEEN start AND end OR NEW.day BETWEEN start AND end))
BEGIN SELECT RAISE(ABORT,'pay_period_locked'); END;
--> statement-breakpoint
CREATE TRIGGER pay_export_guard BEFORE INSERT ON pay_exports
WHEN EXISTS (SELECT 1 FROM pay_exports WHERE tenant=NEW.tenant AND start<=NEW.end AND end>=NEW.start)
  OR EXISTS (SELECT 1 FROM work_entries WHERE tenant=NEW.tenant AND day BETWEEN NEW.start AND NEW.end AND approved_by IS NULL)
  OR NOT EXISTS (SELECT 1 FROM work_entries WHERE tenant=NEW.tenant AND day BETWEEN NEW.start AND NEW.end)
BEGIN SELECT RAISE(ABORT,'pay_period_unavailable'); END;
