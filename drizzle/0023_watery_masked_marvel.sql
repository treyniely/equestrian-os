ALTER TABLE `benefit_offerings` ADD `maximum` integer;
--> statement-breakpoint
DROP VIEW benefit_balances;
--> statement-breakpoint
CREATE VIEW benefit_balances AS
SELECT b.id AS bucket,b.tenant,b.period,b.label,b.quantity,p.customer,p.rider,p.membership,p.plan_id,p.name,p.kind,p.price,p.currency,p.start,p.end,p.start_date,p.end_date,p.anchor,m.status,o.program,o.maximum,
 (SELECT count(*) FROM booking_credits c JOIN enrollments e ON e.tenant=c.tenant AND e.id=c.enrollment JOIN sessions s ON s.tenant=e.tenant AND s.id=e.session WHERE c.tenant=b.tenant AND c.bucket=b.id AND s.status='scheduled' AND s.program=o.program) AS program_used,
 (SELECT count(*) FROM booking_credits c JOIN enrollments e ON e.tenant=c.tenant AND e.id=c.enrollment JOIN sessions s ON s.tenant=e.tenant AND s.id=e.session WHERE c.tenant=b.tenant AND c.bucket=b.id AND s.status='scheduled') AS used
FROM benefit_buckets b JOIN benefit_periods p ON p.tenant=b.tenant AND p.id=b.period JOIN memberships m ON m.tenant=p.tenant AND m.id=p.membership JOIN benefit_offerings o ON o.tenant=b.tenant AND o.bucket=b.id;
--> statement-breakpoint
DROP TRIGGER enrollment_benefit;
--> statement-breakpoint
CREATE TRIGGER enrollment_benefit AFTER INSERT ON enrollments BEGIN
 INSERT INTO booking_credits(tenant,enrollment,bucket)
 SELECT NEW.tenant,NEW.id,b.bucket FROM benefit_balances b
 JOIN sessions s ON s.tenant=NEW.tenant AND s.id=NEW.session AND s.program=b.program
 JOIN resources r ON r.tenant=NEW.tenant AND r.id=NEW.rider AND r.kind='rider'
 WHERE b.tenant=NEW.tenant AND b.customer=json_extract(r.details,'$.customer') AND (b.rider IS NULL OR b.rider=NEW.rider) AND b.status='active' AND s.start>=b.start AND s.start<b.end AND b.used<b.quantity AND (b.maximum IS NULL OR b.program_used<b.maximum)
 ORDER BY b.end,b.bucket LIMIT 1;
 SELECT RAISE(ABORT,'allowance_unavailable') WHERE NOT EXISTS(SELECT 1 FROM booking_credits WHERE tenant=NEW.tenant AND enrollment=NEW.id) AND (EXISTS(SELECT 1 FROM booking_requirements q WHERE q.tenant=NEW.tenant AND q.enrollment=NEW.id) OR EXISTS(SELECT 1 FROM sessions s JOIN resources p ON p.tenant=s.tenant AND p.id=s.program WHERE s.tenant=NEW.tenant AND s.id=NEW.session AND json_extract(p.details,'$.access')='membership'));
 DELETE FROM booking_requirements WHERE tenant=NEW.tenant AND enrollment=NEW.id;
END;
