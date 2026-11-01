CREATE TABLE `horse_health_files` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`horse` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `horse_health_file_owner` ON `horse_health_files` (`tenant`,`horse`);--> statement-breakpoint
CREATE TABLE `horse_health_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`horse` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`provider` text NOT NULL,
	`notes` text NOT NULL,
	`next_due` text NOT NULL,
	`followup_done` integer DEFAULT 0 NOT NULL,
	`files` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `horse_health_history` ON `horse_health_records` (`tenant`,`horse`,`date`);--> statement-breakpoint
CREATE INDEX `horse_health_due` ON `horse_health_records` (`tenant`,`horse`,`next_due`);--> statement-breakpoint
CREATE TRIGGER health_record_revision BEFORE UPDATE ON horse_health_records
WHEN NEW.revision<>OLD.revision+1 BEGIN
 SELECT RAISE(ABORT,'health_record_stale');
END;
