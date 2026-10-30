CREATE TABLE `trainer_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`trainer` text NOT NULL,
	`rating` integer NOT NULL,
	`message` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trainer_review_family` ON `trainer_reviews` (`tenant`,`customer`,`trainer`);--> statement-breakpoint
CREATE INDEX `trainer_review_queue` ON `trainer_reviews` (`tenant`,`status`);--> statement-breakpoint
ALTER TABLE `customers` ADD `emergency_contacts` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `contacts_revision` integer DEFAULT 0 NOT NULL;