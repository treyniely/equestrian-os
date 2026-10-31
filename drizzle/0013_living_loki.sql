CREATE TABLE `rider_horses` (
	`tenant` text NOT NULL,
	`session` text NOT NULL,
	`rider` text NOT NULL,
	`horse` text NOT NULL,
	`auto_reserved` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rider_horse_once` ON `rider_horses` (`tenant`,`session`,`rider`);--> statement-breakpoint
CREATE UNIQUE INDEX `horse_rider_once` ON `rider_horses` (`tenant`,`session`,`horse`);--> statement-breakpoint
CREATE TABLE `session_horse_plans` (
	`tenant` text NOT NULL,
	`session` text NOT NULL,
	`revision` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_horse_plan_once` ON `session_horse_plans` (`tenant`,`session`);--> statement-breakpoint
CREATE TRIGGER horse_plan_revision_insert BEFORE INSERT ON session_horse_plans BEGIN
 SELECT RAISE(ABORT,'horse_plan_changed') WHERE NEW.revision<>1 AND NOT EXISTS(SELECT 1 FROM session_horse_plans WHERE tenant=NEW.tenant AND session=NEW.session);
END;
--> statement-breakpoint
CREATE TRIGGER horse_plan_revision_update BEFORE UPDATE ON session_horse_plans BEGIN
 SELECT RAISE(ABORT,'horse_plan_changed') WHERE NEW.revision<>OLD.revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER rider_horse_guard BEFORE INSERT ON rider_horses BEGIN
 SELECT RAISE(ABORT,'rider_not_enrolled') WHERE NOT EXISTS(SELECT 1 FROM enrollments e JOIN sessions s ON s.id=e.session AND s.tenant=e.tenant WHERE e.tenant=NEW.tenant AND e.session=NEW.session AND e.rider=NEW.rider AND s.status='scheduled');
 SELECT RAISE(ABORT,'invalid_horse') WHERE NOT EXISTS(SELECT 1 FROM resources WHERE tenant=NEW.tenant AND id=NEW.horse AND kind='horse');
END;
--> statement-breakpoint
CREATE TRIGGER remove_enrollment_horse AFTER DELETE ON enrollments BEGIN
 DELETE FROM reservations WHERE tenant=OLD.tenant AND session=OLD.session AND kind='horse' AND resource IN (SELECT horse FROM rider_horses WHERE tenant=OLD.tenant AND session=OLD.session AND rider=OLD.rider AND auto_reserved=1);
 UPDATE barn_tasks SET status='canceled',updated=CAST(strftime('%s','now') AS INTEGER)*1000 WHERE tenant=OLD.tenant AND session=OLD.session AND status IN ('todo','doing') AND generated_key IN (SELECT OLD.session||':prepare:'||horse FROM rider_horses WHERE tenant=OLD.tenant AND session=OLD.session AND rider=OLD.rider AND auto_reserved=1);
 DELETE FROM rider_horses WHERE tenant=OLD.tenant AND session=OLD.session AND rider=OLD.rider;
 UPDATE session_horse_plans SET revision=revision+1 WHERE tenant=OLD.tenant AND session=OLD.session;
END;
