ALTER TABLE `leaks` ADD `sampleData` json;--> statement-breakpoint
ALTER TABLE `leaks` ADD `sourceUrl` text;--> statement-breakpoint
ALTER TABLE `leaks` ADD `sourcePlatform` varchar(255);--> statement-breakpoint
ALTER TABLE `leaks` ADD `screenshotUrls` json;--> statement-breakpoint
ALTER TABLE `leaks` ADD `threatActor` varchar(255);--> statement-breakpoint
ALTER TABLE `leaks` ADD `leakPrice` varchar(100);--> statement-breakpoint
ALTER TABLE `leaks` ADD `breachMethod` varchar(255);--> statement-breakpoint
ALTER TABLE `leaks` ADD `breachMethodAr` varchar(255);