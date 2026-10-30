CREATE TABLE `barn_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`intern` text,
	`session` text,
	`due` integer NOT NULL,
	`status` text NOT NULL,
	`generated_key` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `barn_task_day` ON `barn_tasks` (`tenant`,`date`);--> statement-breakpoint
CREATE TABLE `intern_attendance` (
	`tenant` text NOT NULL,
	`intern` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `intern_attendance_day` ON `intern_attendance` (`tenant`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX intern_attendance_once ON intern_attendance(tenant,intern,date);
--> statement-breakpoint
CREATE UNIQUE INDEX barn_generated_once ON barn_tasks(tenant,generated_key);
