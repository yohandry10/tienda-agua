CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`mode` text NOT NULL,
	`token` text NOT NULL,
	`trans_id` text NOT NULL,
	`trans_date` text NOT NULL,
	`trans_day` text NOT NULL,
	`amount` integer NOT NULL,
	`state` text DEFAULT 'pendiente' NOT NULL,
	`gateway_status` text,
	`gateway_uuid` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "payment_mode_valid" CHECK("payment_attempts"."mode" IN ('TEST','PRODUCTION'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_attempts_token_unique` ON `payment_attempts` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_daily_transaction` ON `payment_attempts` (`mode`,`trans_day`,`trans_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_open_attempt` ON `payment_attempts` (`order_id`,`mode`) WHERE "payment_attempts"."state" IN ('pendiente','autorizado','pagado');--> statement-breakpoint
CREATE INDEX `payment_order_lookup` ON `payment_attempts` (`order_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `orders` ADD `email` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_mode` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'pendiente' NOT NULL;