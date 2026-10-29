CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`stage` text NOT NULL,
	`billing` text NOT NULL,
	`balance` integer NOT NULL,
	`notes` text NOT NULL,
	`email_consent` integer NOT NULL,
	`sms_consent` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customer_tenant` ON `customers` (`tenant`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`segment` text NOT NULL,
	`channel` text NOT NULL,
	`message` text NOT NULL,
	`delay` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`session` text NOT NULL,
	`rider` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `enrollment_session` ON `enrollments` (`tenant`,`session`);--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`customer` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `membership_customer` ON `memberships` (`tenant`,`customer`);--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`session` text NOT NULL,
	`resource` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reservation_lookup` ON `reservations` (`tenant`,`resource`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`program` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`capacity` integer NOT NULL,
	`status` text NOT NULL,
	`request_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `session_time` ON `sessions` (`tenant`,`start`);--> statement-breakpoint
CREATE UNIQUE INDEX session_retry ON sessions(tenant,request_key);
--> statement-breakpoint
CREATE UNIQUE INDEX enrollment_once ON enrollments(tenant,session,rider);
--> statement-breakpoint
CREATE TRIGGER reservation_guard BEFORE INSERT ON reservations BEGIN
 SELECT RAISE(ABORT,'invalid_session') WHERE NOT EXISTS(SELECT 1 FROM sessions WHERE id=NEW.session AND tenant=NEW.tenant AND status='scheduled');
 SELECT RAISE(ABORT,'resource_conflict') WHERE EXISTS(SELECT 1 FROM reservations r JOIN sessions old ON old.id=r.session AND old.tenant=r.tenant JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE r.tenant=NEW.tenant AND r.resource=NEW.resource AND old.status='scheduled' AND current.start<old.end AND old.start<current.end);
 SELECT RAISE(ABORT,'resource_conflict') WHERE EXISTS(SELECT 1 FROM bookings b JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE b.tenant=NEW.tenant AND b.status<>'canceled' AND current.start<b.end AND b.start<current.end AND ((NEW.kind='trainer' AND b.trainer=NEW.resource) OR (NEW.kind='horse' AND b.horse=NEW.resource) OR (NEW.kind='arena' AND b.arena=NEW.resource)));
END;
--> statement-breakpoint
CREATE TRIGGER enrollment_guard BEFORE INSERT ON enrollments BEGIN
 SELECT RAISE(ABORT,'invalid_session') WHERE NOT EXISTS(SELECT 1 FROM sessions WHERE id=NEW.session AND tenant=NEW.tenant AND status='scheduled');
 SELECT RAISE(ABORT,'session_full') WHERE (SELECT count(*) FROM enrollments WHERE tenant=NEW.tenant AND session=NEW.session)>=(SELECT CASE WHEN json_extract(p.details,'$.template')='party' THEN 1 ELSE s.capacity END FROM sessions s JOIN resources p ON p.id=s.program AND p.tenant=s.tenant WHERE s.id=NEW.session AND s.tenant=NEW.tenant);
 SELECT RAISE(ABORT,'rider_conflict') WHERE EXISTS(SELECT 1 FROM enrollments e JOIN sessions old ON old.id=e.session AND old.tenant=e.tenant JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE e.tenant=NEW.tenant AND e.rider=NEW.rider AND old.status='scheduled' AND current.start<old.end AND old.start<current.end);
 SELECT RAISE(ABORT,'rider_conflict') WHERE EXISTS(SELECT 1 FROM bookings b JOIN sessions current ON current.id=NEW.session AND current.tenant=NEW.tenant WHERE b.tenant=NEW.tenant AND b.rider=NEW.rider AND b.status<>'canceled' AND current.start<b.end AND b.start<current.end);
END;
