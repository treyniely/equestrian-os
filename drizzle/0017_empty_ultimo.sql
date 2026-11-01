CREATE TABLE `billing_accounts` (
	`tenant` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`live` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_account_once` ON `billing_accounts` (`account`);--> statement-breakpoint
CREATE TABLE `billing_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`plan` text NOT NULL,
	`account` text NOT NULL,
	`snapshot` text NOT NULL,
	`product` text NOT NULL,
	`price` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_catalog_version` ON `billing_catalog` (`tenant`,`plan`,`account`,`snapshot`);--> statement-breakpoint
CREATE TABLE `billing_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`account` text NOT NULL,
	`stripe_customer` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `billing_family_once` ON `billing_customers` (`tenant`,`customer`,`account`);--> statement-breakpoint
CREATE TABLE `billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `billing_states` (
	`hash` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`actor` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rider_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`rider` text NOT NULL,
	`account` text NOT NULL,
	`catalog` text NOT NULL,
	`stripe_customer` text NOT NULL,
	`subscription` text,
	`checkout` text,
	`status` text NOT NULL,
	`period_end` integer,
	`cancel_at_end` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rider_subscription_once` ON `rider_subscriptions` (`tenant`,`rider`);--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_subscription_once` ON `rider_subscriptions` (`account`,`subscription`);