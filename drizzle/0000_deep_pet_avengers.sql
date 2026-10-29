CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`action` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`rider` text NOT NULL,
	`trainer` text NOT NULL,
	`horse` text NOT NULL,
	`arena` text NOT NULL,
	`lesson` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`status` text NOT NULL,
	`request_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `booking_tenant_time` ON `bookings` (`tenant`,`start`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`details` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `resource_tenant` ON `resources` (`tenant`);--> statement-breakpoint
CREATE UNIQUE INDEX booking_request_unique ON bookings(tenant,request_key);
--> statement-breakpoint
CREATE TRIGGER booking_resource_guard BEFORE INSERT ON bookings WHEN NEW.status <> 'canceled' BEGIN
 SELECT RAISE(ABORT,'resource_conflict') WHERE EXISTS(SELECT 1 FROM bookings b WHERE b.tenant=NEW.tenant AND b.status<>'canceled' AND NEW.start<b.end AND b.start<NEW.end AND (b.trainer=NEW.trainer OR b.horse=NEW.horse OR b.arena=NEW.arena OR b.rider=NEW.rider));
END;
