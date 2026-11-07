CREATE TABLE `barn_workers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`classification` text NOT NULL,
	`commitment` text NOT NULL,
	`basis` text NOT NULL,
	`rate` integer NOT NULL,
	`onboarding` text NOT NULL,
	`provider_ref` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `barn_workers_tenant` ON `barn_workers` (`tenant`);