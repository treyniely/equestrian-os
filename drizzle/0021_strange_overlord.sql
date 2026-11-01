CREATE TABLE `horse_record_ai` (
	`record` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`horse` text NOT NULL,
	`state` text NOT NULL,
	`origin` text NOT NULL,
	`token` text NOT NULL,
	`data` text NOT NULL,
	`search_text` text NOT NULL,
	`error` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `horse_ai_scope` ON `horse_record_ai` (`tenant`,`horse`);