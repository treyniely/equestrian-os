CREATE TABLE `booking_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`rider` text NOT NULL,
	`kind` text NOT NULL,
	`previous_session` text NOT NULL,
	`next_session` text,
	`reason` text NOT NULL,
	`created` integer NOT NULL,
	`read_at` integer
);
--> statement-breakpoint
CREATE INDEX `booking_change_inbox` ON `booking_changes` (`tenant`,`created`);