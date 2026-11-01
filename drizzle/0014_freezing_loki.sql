CREATE TABLE `benefit_buckets` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`period` text NOT NULL,
	`label` text NOT NULL,
	`quantity` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `benefit_bucket_period` ON `benefit_buckets` (`tenant`,`period`);--> statement-breakpoint
CREATE TABLE `benefit_offerings` (
	`tenant` text NOT NULL,
	`bucket` text NOT NULL,
	`program` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `benefit_offering_once` ON `benefit_offerings` (`tenant`,`bucket`,`program`);--> statement-breakpoint
CREATE TABLE `benefit_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`membership` text NOT NULL,
	`customer` text NOT NULL,
	`rider` text,
	`plan_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`price` integer NOT NULL,
	`currency` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`anchor` integer NOT NULL,
	`request_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `benefit_period_retry` ON `benefit_periods` (`tenant`,`request_key`);--> statement-breakpoint
CREATE INDEX `benefit_period_customer` ON `benefit_periods` (`tenant`,`customer`,`start`);--> statement-breakpoint
CREATE TABLE `booking_credits` (
	`tenant` text NOT NULL,
	`enrollment` text NOT NULL,
	`bucket` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_credit_once` ON `booking_credits` (`tenant`,`enrollment`);--> statement-breakpoint
CREATE INDEX `booking_credit_usage` ON `booking_credits` (`tenant`,`bucket`);--> statement-breakpoint
CREATE VIEW benefit_balances AS
SELECT b.id AS bucket,b.tenant,b.period,b.label,b.quantity,p.customer,p.rider,p.membership,p.plan_id,p.name,p.kind,p.price,p.currency,p.start,p.end,p.start_date,p.end_date,p.anchor,m.status,o.program,
 (SELECT count(*) FROM booking_credits c JOIN enrollments e ON e.tenant=c.tenant AND e.id=c.enrollment JOIN sessions s ON s.tenant=e.tenant AND s.id=e.session WHERE c.tenant=b.tenant AND c.bucket=b.id AND s.status='scheduled') AS used
FROM benefit_buckets b JOIN benefit_periods p ON p.tenant=b.tenant AND p.id=b.period JOIN memberships m ON m.tenant=p.tenant AND m.id=p.membership JOIN benefit_offerings o ON o.tenant=b.tenant AND o.bucket=b.id;
--> statement-breakpoint
CREATE TRIGGER benefit_period_overlap BEFORE INSERT ON benefit_periods BEGIN
 SELECT RAISE(ABORT,'benefit_period_overlap') WHERE NEW.end<=NEW.start OR EXISTS(SELECT 1 FROM benefit_periods p WHERE p.tenant=NEW.tenant AND p.membership=NEW.membership AND p.start<NEW.end AND NEW.start<p.end);
END;
--> statement-breakpoint
CREATE TRIGGER enrollment_benefit AFTER INSERT ON enrollments BEGIN
 INSERT INTO booking_credits(tenant,enrollment,bucket)
 SELECT NEW.tenant,NEW.id,b.bucket FROM benefit_balances b
 JOIN sessions s ON s.tenant=NEW.tenant AND s.id=NEW.session AND s.program=b.program
 JOIN resources r ON r.tenant=NEW.tenant AND r.id=NEW.rider AND r.kind='rider'
 WHERE b.tenant=NEW.tenant AND b.customer=json_extract(r.details,'$.customer') AND (b.rider IS NULL OR b.rider=NEW.rider) AND b.status='active' AND s.start>=b.start AND s.start<b.end AND b.used<b.quantity
 ORDER BY b.end,b.bucket LIMIT 1;
 SELECT RAISE(ABORT,'allowance_unavailable') WHERE NOT EXISTS(SELECT 1 FROM booking_credits WHERE tenant=NEW.tenant AND enrollment=NEW.id) AND EXISTS(SELECT 1 FROM sessions s JOIN resources p ON p.tenant=s.tenant AND p.id=s.program WHERE s.tenant=NEW.tenant AND s.id=NEW.session AND json_extract(p.details,'$.access')='membership');
END;
--> statement-breakpoint
CREATE TRIGGER enrollment_credit_release AFTER DELETE ON enrollments BEGIN
 DELETE FROM booking_credits WHERE tenant=OLD.tenant AND enrollment=OLD.id;
END;
