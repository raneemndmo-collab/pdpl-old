CREATE TABLE `kb_search_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kbsQuery` text NOT NULL,
	`kbsResultsCount` int DEFAULT 0,
	`kbsMatchedIds` json,
	`kbsUserId` int,
	`kbsSource` enum('manual','ai_auto','api') NOT NULL DEFAULT 'manual',
	`kbsCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_search_log_id` PRIMARY KEY(`id`)
);
