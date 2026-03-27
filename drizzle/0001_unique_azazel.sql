CREATE TABLE `attraction_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attractionId` int NOT NULL,
	`dayId` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attraction_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`address` text,
	`lat` float,
	`lng` float,
	`placeId` varchar(255),
	`photoUrl` text,
	`rating` float,
	`status` enum('idea','confirmed') NOT NULL DEFAULT 'idea',
	`category` varchar(100),
	`website` text,
	`phoneNumber` varchar(50),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itinerary_days` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayNumber` int NOT NULL,
	`label` varchar(100),
	`date` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `itinerary_days_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attractionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_vote` UNIQUE(`userId`,`attractionId`)
);
--> statement-breakpoint
ALTER TABLE `attraction_days` ADD CONSTRAINT `attraction_days_attractionId_attractions_id_fk` FOREIGN KEY (`attractionId`) REFERENCES `attractions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attraction_days` ADD CONSTRAINT `attraction_days_dayId_itinerary_days_id_fk` FOREIGN KEY (`dayId`) REFERENCES `itinerary_days`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attractions` ADD CONSTRAINT `attractions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_attractionId_attractions_id_fk` FOREIGN KEY (`attractionId`) REFERENCES `attractions`(`id`) ON DELETE cascade ON UPDATE no action;