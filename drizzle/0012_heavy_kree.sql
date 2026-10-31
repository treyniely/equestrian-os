CREATE TABLE `schedule_batches` (
	`tenant` text NOT NULL,
	`request_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_batch_retry` ON `schedule_batches` (`tenant`,`request_key`);