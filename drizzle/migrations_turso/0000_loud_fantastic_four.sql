CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `agent_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text,
	`state` text NOT NULL,
	`lga` text NOT NULL,
	`town` text NOT NULL,
	`type` text NOT NULL,
	`occupation` text NOT NULL,
	`has_shop` integer DEFAULT false NOT NULL,
	`note` text,
	`consent` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text,
	`state` text NOT NULL,
	`lga` text,
	`town` text,
	`type` text DEFAULT 'Agent' NOT NULL,
	`status` text DEFAULT 'Approved' NOT NULL,
	`show_publicly` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`idempotency_key` text,
	`category` text NOT NULL,
	`product_id` text,
	`product_name` text NOT NULL,
	`price` integer NOT NULL,
	`duration` integer NOT NULL,
	`frequency` text NOT NULL,
	`payment_amount` integer,
	`final_payment_amount` integer,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp` text,
	`email` text,
	`state` text NOT NULL,
	`lga` text NOT NULL,
	`address` text NOT NULL,
	`occupation` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`notes` text,
	`deposit` integer DEFAULT 0 NOT NULL,
	`charges` integer DEFAULT 0 NOT NULL,
	`payment_count` integer,
	`total_amount` integer,
	`plan_snapshot` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_reference_unique` ON `applications` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `applications_idempotency_key_unique` ON `applications` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery` (
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`video_url` text,
	`caption` text,
	`category` text DEFAULT 'general' NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `installment_rules` (
	`duration_months` integer PRIMARY KEY NOT NULL,
	`markup_percent` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `land_inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`state` text NOT NULL,
	`plot_id` text,
	`plot_name` text,
	`payment_plan` text,
	`visit_date` text,
	`message` text,
	`status` text DEFAULT 'New' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`plot_id`) REFERENCES `plots`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`topic` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plots` (
	`id` text PRIMARY KEY NOT NULL,
	`estate_name` text NOT NULL,
	`slug` text NOT NULL,
	`state` text NOT NULL,
	`town` text NOT NULL,
	`size_sqm` integer NOT NULL,
	`cash_price` integer NOT NULL,
	`plan_summary` text,
	`monthly_amount` integer,
	`plan_months` integer,
	`status` text DEFAULT 'Available' NOT NULL,
	`documents` text DEFAULT '[]' NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`location_description` text,
	`landmarks` text DEFAULT '[]' NOT NULL,
	`map_link` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plots_slug_unique` ON `plots` (`slug`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`brand` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`cash_price` integer NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`specs` text DEFAULT '{}' NOT NULL,
	`in_stock` integer DEFAULT true NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`impersonated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`business` text,
	`state` text,
	`quote` text NOT NULL,
	`photo` text,
	`video_url` text,
	`category` text DEFAULT 'general' NOT NULL,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `training_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`learn` text DEFAULT '[]' NOT NULL,
	`duration` text,
	`price` integer DEFAULT 0 NOT NULL,
	`start_date` text,
	`mode` text DEFAULT 'In person' NOT NULL,
	`seats_left` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_courses_slug_unique` ON `training_courses` (`slug`);--> statement-breakpoint
CREATE TABLE `training_signups` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text,
	`course_title` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`state` text NOT NULL,
	`education` text,
	`experience` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `training_courses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'staff',
	`banned` integer,
	`ban_reason` text,
	`ban_expires` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
