CREATE TABLE `schedule_undo` (
	`token` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`sessions` text NOT NULL,
	`draft` text,
	`request_key` text NOT NULL,
	`created` integer NOT NULL,
	`undone` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `schedule_undo_tenant` ON `schedule_undo` (`tenant`,`created`);--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_undo_request` ON `schedule_undo` (`tenant`,`request_key`);--> statement-breakpoint
CREATE TRIGGER schedule_undo_guard BEFORE UPDATE OF undone ON schedule_undo
WHEN OLD.undone=0 AND NEW.undone=1 BEGIN
 SELECT RAISE(ABORT,'schedule_undo_expired') WHERE CAST(strftime('%s','now') AS INTEGER)*1000-OLD.created>15000;
 SELECT RAISE(ABORT,'schedule_changed') WHERE (SELECT count(*) FROM sessions s WHERE s.tenant=OLD.tenant AND s.status='scheduled' AND s.id IN (SELECT value FROM json_each(OLD.sessions)))<>json_array_length(OLD.sessions);
 SELECT RAISE(ABORT,'schedule_already_used') WHERE EXISTS(SELECT 1 FROM enrollments e WHERE e.tenant=OLD.tenant AND e.session IN (SELECT value FROM json_each(OLD.sessions))) OR EXISTS(SELECT 1 FROM booking_changes c WHERE c.tenant=OLD.tenant AND (c.previous_session IN (SELECT value FROM json_each(OLD.sessions)) OR c.next_session IN (SELECT value FROM json_each(OLD.sessions)))) OR EXISTS(SELECT 1 FROM barn_tasks t WHERE t.tenant=OLD.tenant AND t.session IN (SELECT value FROM json_each(OLD.sessions)) AND t.status NOT IN ('todo','canceled'));
END;
