CREATE TABLE `academies` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_owner` ON `academies` (`owner`);--> statement-breakpoint
DROP INDEX IF EXISTS team_user_unique;
--> statement-breakpoint
CREATE UNIQUE INDEX team_academy_user_unique ON team_access(tenant,user_id) WHERE user_id IS NOT NULL;
