CREATE TABLE `evidence_chain` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceId` varchar(64) NOT NULL,
	`evidenceLeakId` varchar(32) NOT NULL,
	`evidenceType` enum('text','screenshot','file','metadata') NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`previousHash` varchar(128),
	`blockIndex` int NOT NULL,
	`capturedBy` varchar(255),
	`evidenceMetadata` json,
	`isVerified` boolean NOT NULL DEFAULT true,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`evidenceCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_chain_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_chain_evidenceId_unique` UNIQUE(`evidenceId`)
);
--> statement-breakpoint
CREATE TABLE `feedback_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedbackLeakId` varchar(32) NOT NULL,
	`feedbackUserId` int,
	`feedbackUserName` varchar(255),
	`systemClassification` enum('personal_data','cybersecurity','clean','unknown') NOT NULL,
	`analystClassification` enum('personal_data','cybersecurity','clean','unknown') NOT NULL,
	`isCorrect` boolean NOT NULL,
	`feedbackNotes` text,
	`feedbackCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_graph_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceNodeId` varchar(64) NOT NULL,
	`targetNodeId` varchar(64) NOT NULL,
	`edgeRelationship` varchar(100) NOT NULL,
	`edgeRelationshipAr` varchar(100),
	`edgeWeight` int DEFAULT 1,
	`edgeMetadata` json,
	`edgeCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_graph_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_graph_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`nodeType` enum('leak','seller','entity','sector','pii_type','platform','campaign') NOT NULL,
	`nodeLabel` varchar(255) NOT NULL,
	`nodeLabelAr` varchar(255),
	`nodeMetadata` json,
	`nodeCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_graph_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledge_graph_nodes_nodeId_unique` UNIQUE(`nodeId`)
);
--> statement-breakpoint
CREATE TABLE `osint_queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryId` varchar(32) NOT NULL,
	`queryName` varchar(255) NOT NULL,
	`queryNameAr` varchar(255) NOT NULL,
	`queryType` enum('google_dork','shodan','recon','spiderfoot') NOT NULL,
	`queryCategory` varchar(100) NOT NULL,
	`queryCategoryAr` varchar(100),
	`queryText` text NOT NULL,
	`queryDescription` text,
	`queryDescriptionAr` text,
	`queryResultsCount` int DEFAULT 0,
	`queryLastRunAt` timestamp,
	`queryEnabled` boolean NOT NULL DEFAULT true,
	`queryCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `osint_queries_id` PRIMARY KEY(`id`),
	CONSTRAINT `osint_queries_queryId_unique` UNIQUE(`queryId`)
);
--> statement-breakpoint
CREATE TABLE `seller_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` varchar(64) NOT NULL,
	`sellerName` varchar(255) NOT NULL,
	`sellerAliases` json,
	`sellerPlatforms` json NOT NULL,
	`totalLeaks` int DEFAULT 0,
	`sellerTotalRecords` int DEFAULT 0,
	`sellerRiskScore` int DEFAULT 0,
	`sellerRiskLevel` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`sellerSectors` json,
	`sellerLastActivity` timestamp,
	`sellerFirstSeen` timestamp NOT NULL DEFAULT (now()),
	`sellerNotes` text,
	`sellerIsActive` boolean NOT NULL DEFAULT true,
	`sellerCreatedAt` timestamp NOT NULL DEFAULT (now()),
	`sellerUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seller_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `seller_profiles_sellerId_unique` UNIQUE(`sellerId`)
);
--> statement-breakpoint
CREATE TABLE `threat_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` varchar(32) NOT NULL,
	`ruleName` varchar(255) NOT NULL,
	`ruleNameAr` varchar(255) NOT NULL,
	`ruleDescription` text,
	`ruleDescriptionAr` text,
	`ruleCategory` enum('data_leak','credentials','sale_ad','db_dump','financial','health','government','telecom','education','infrastructure') NOT NULL,
	`ruleSeverity` enum('critical','high','medium','low') NOT NULL,
	`rulePatterns` json NOT NULL,
	`ruleKeywords` json,
	`ruleEnabled` boolean NOT NULL DEFAULT true,
	`ruleMatchCount` int DEFAULT 0,
	`ruleLastMatchAt` timestamp,
	`ruleCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `threat_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `threat_rules_ruleId_unique` UNIQUE(`ruleId`)
);
