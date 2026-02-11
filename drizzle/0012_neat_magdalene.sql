CREATE TABLE `incident_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` varchar(64) NOT NULL,
	`leakId` varchar(32) NOT NULL,
	`verificationCode` varchar(32) NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`documentType` enum('incident_report','custom_report','executive_summary') NOT NULL DEFAULT 'incident_report',
	`title` varchar(500) NOT NULL,
	`titleAr` varchar(500) NOT NULL,
	`generatedBy` int NOT NULL,
	`generatedByName` varchar(200),
	`pdfUrl` text,
	`docMetadata` json,
	`isVerified` boolean DEFAULT true,
	`docCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `incident_documents_documentId_unique` UNIQUE(`documentId`),
	CONSTRAINT `incident_documents_verificationCode_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
CREATE TABLE `report_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`documentId` varchar(64),
	`reportType` varchar(100) NOT NULL,
	`generatedBy` int NOT NULL,
	`generatedByName` varchar(200),
	`complianceAcknowledged` boolean DEFAULT false,
	`acknowledgedAt` timestamp,
	`reportFilters` json,
	`reportMetadata` json,
	`reportCreatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_audit_id` PRIMARY KEY(`id`)
);
