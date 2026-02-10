CREATE TABLE `alert_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactNameAr` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`contactRole` varchar(100),
	`contactRoleAr` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`alertChannels` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int,
	`contactId` int,
	`alertContactName` varchar(255),
	`deliveryChannel` enum('email','sms') NOT NULL,
	`alertSubject` varchar(500) NOT NULL,
	`alertBody` text,
	`deliveryStatus` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`alertLeakId` varchar(32),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`ruleNameAr` varchar(255),
	`severityThreshold` enum('critical','high','medium','low') NOT NULL,
	`alertChannel` enum('email','sms','both') NOT NULL DEFAULT 'email',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`ruleRecipients` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retention_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`retentionEntity` enum('leaks','audit_logs','notifications','pii_scans','paste_entries') NOT NULL,
	`entityLabel` varchar(100) NOT NULL,
	`entityLabelAr` varchar(100) NOT NULL,
	`retentionDays` int NOT NULL DEFAULT 365,
	`archiveAction` enum('delete','archive') NOT NULL DEFAULT 'archive',
	`isEnabled` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`recordsArchived` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `retention_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `retention_policies_retentionEntity_unique` UNIQUE(`retentionEntity`)
);
--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiSeverity` enum('critical','high','medium','low');--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiSummary` text;--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiSummaryAr` text;--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiRecommendations` json;--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiRecommendationsAr` json;--> statement-breakpoint
ALTER TABLE `leaks` ADD `aiConfidence` int;--> statement-breakpoint
ALTER TABLE `leaks` ADD `enrichedAt` timestamp;