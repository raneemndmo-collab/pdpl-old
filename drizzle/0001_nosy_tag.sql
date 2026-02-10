CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`platform` enum('telegram','darkweb','paste') NOT NULL,
	`subscribers` int DEFAULT 0,
	`status` enum('active','paused','flagged') NOT NULL DEFAULT 'active',
	`lastActivity` timestamp,
	`leaksDetected` int DEFAULT 0,
	`riskLevel` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_channelId_unique` UNIQUE(`channelId`)
);
--> statement-breakpoint
CREATE TABLE `dark_web_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleAr` varchar(500),
	`listingSeverity` enum('critical','high','medium','low') NOT NULL,
	`sourceChannelId` int,
	`sourceName` varchar(255),
	`price` varchar(50),
	`recordCount` int DEFAULT 0,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dark_web_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leakId` varchar(32) NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleAr` varchar(500) NOT NULL,
	`source` enum('telegram','darkweb','paste') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`sector` varchar(100) NOT NULL,
	`sectorAr` varchar(100) NOT NULL,
	`piiTypes` json NOT NULL,
	`recordCount` int NOT NULL DEFAULT 0,
	`status` enum('new','analyzing','documented','reported') NOT NULL DEFAULT 'new',
	`description` text,
	`descriptionAr` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaks_id` PRIMARY KEY(`id`),
	CONSTRAINT `leaks_leakId_unique` UNIQUE(`leakId`)
);
--> statement-breakpoint
CREATE TABLE `paste_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`fileSize` varchar(50),
	`pastePiiTypes` json,
	`preview` text,
	`pasteStatus` enum('flagged','analyzing','documented','reported') NOT NULL DEFAULT 'flagged',
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paste_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pii_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`inputText` text NOT NULL,
	`results` json NOT NULL,
	`totalMatches` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pii_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`titleAr` varchar(500),
	`type` enum('monthly','quarterly','special') NOT NULL,
	`reportStatus` enum('draft','published') NOT NULL DEFAULT 'draft',
	`pageCount` int DEFAULT 0,
	`generatedBy` int,
	`fileUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `ndmoRole` enum('executive','manager','analyst','viewer') DEFAULT 'viewer' NOT NULL;