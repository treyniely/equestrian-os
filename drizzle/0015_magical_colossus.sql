CREATE TABLE `booking_requirements` (
	`tenant` text NOT NULL,
	`enrollment` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_requirement_once` ON `booking_requirements` (`tenant`,`enrollment`);
--> statement-breakpoint
DROP TRIGGER enrollment_benefit;
--> statement-breakpoint
CREATE TRIGGER enrollment_benefit AFTER INSERT ON enrollments BEGIN
 INSERT INTO booking_credits(tenant,enrollment,bucket)
 SELECT NEW.tenant,NEW.id,b.bucket FROM benefit_balances b
 JOIN sessions s ON s.tenant=NEW.tenant AND s.id=NEW.session AND s.program=b.program
 JOIN resources r ON r.tenant=NEW.tenant AND r.id=NEW.rider AND r.kind='rider'
 WHERE b.tenant=NEW.tenant AND b.customer=json_extract(r.details,'$.customer') AND (b.rider IS NULL OR b.rider=NEW.rider) AND b.status='active' AND s.start>=b.start AND s.start<b.end AND b.used<b.quantity
 ORDER BY b.end,b.bucket LIMIT 1;
 SELECT RAISE(ABORT,'allowance_unavailable') WHERE NOT EXISTS(SELECT 1 FROM booking_credits WHERE tenant=NEW.tenant AND enrollment=NEW.id) AND (EXISTS(SELECT 1 FROM booking_requirements q WHERE q.tenant=NEW.tenant AND q.enrollment=NEW.id) OR EXISTS(SELECT 1 FROM sessions s JOIN resources p ON p.tenant=s.tenant AND p.id=s.program WHERE s.tenant=NEW.tenant AND s.id=NEW.session AND json_extract(p.details,'$.access')='membership'));
 DELETE FROM booking_requirements WHERE tenant=NEW.tenant AND enrollment=NEW.id;
END;
