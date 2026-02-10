CREATE TABLE `platform_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(50) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320),
	`mobile` varchar(20),
	`displayName` varchar(200) NOT NULL,
	`platformRole` enum('root_admin','director','vice_president','manager','analyst','viewer') NOT NULL DEFAULT 'viewer',
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_users_userId_unique` UNIQUE(`userId`)
);
