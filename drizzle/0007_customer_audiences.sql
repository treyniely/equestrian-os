CREATE TABLE `customer_groups` (
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`group_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_group_lookup` ON `customer_groups` (`tenant`,`customer`);--> statement-breakpoint
ALTER TABLE `customers` ADD `adult_confirmed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `drafts` ADD `audience` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX customer_group_once ON customer_groups(tenant,customer,group_id);
