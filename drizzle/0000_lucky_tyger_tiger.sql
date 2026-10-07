CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`fingerprint` text NOT NULL,
	`user_id` text,
	`creator_id` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`district` text NOT NULL,
	`kind` text NOT NULL,
	`payment` text NOT NULL,
	`notes` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`channel` text DEFAULT 'web' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_id` ON `orders` (`request_id`);--> statement-breakpoint
CREATE TABLE `team` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
