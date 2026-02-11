CREATE TABLE `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ccConversationId` varchar(64) NOT NULL,
	`ccUserId` varchar(64) NOT NULL,
	`ccUserName` varchar(255),
	`ccTitle` varchar(500) NOT NULL,
	`ccSummary` text,
	`ccMessageCount` int NOT NULL DEFAULT 0,
	`ccTotalToolsUsed` int NOT NULL DEFAULT 0,
	`ccStatus` enum('active','archived','exported') NOT NULL DEFAULT 'active',
	`ccCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`ccUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_conversations_ccConversationId_unique` UNIQUE(`ccConversationId`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cmConversationId` varchar(64) NOT NULL,
	`cmMessageId` varchar(64) NOT NULL,
	`cmRole` enum('user','assistant') NOT NULL,
	`cmContent` text NOT NULL,
	`cmToolsUsed` json,
	`cmThinkingSteps` json,
	`cmRating` int,
	`cmCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
