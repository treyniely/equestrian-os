CREATE TABLE `family_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`user_id` text NOT NULL,
	`customer` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `family_user` ON `family_accounts` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX family_tenant_user ON family_accounts(tenant,user_id);
--> statement-breakpoint
CREATE UNIQUE INDEX family_tenant_customer ON family_accounts(tenant,customer);
