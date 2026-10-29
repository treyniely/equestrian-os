CREATE TABLE `team_access` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`permissions` text NOT NULL,
	`status` text NOT NULL,
	`token_hash` text,
	`expires` integer,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_tenant` ON `team_access` (`tenant`);--> statement-breakpoint
CREATE UNIQUE INDEX team_user_unique ON team_access(user_id) WHERE user_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX team_email_unique ON team_access(tenant,email);
--> statement-breakpoint
CREATE UNIQUE INDEX team_invite_unique ON team_access(token_hash) WHERE token_hash IS NOT NULL;
