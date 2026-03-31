CREATE TABLE `attraction_days_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attractionId` int NOT NULL,
	`dayId` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`time` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attraction_days_v2_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attractions_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`address` text,
	`lat` float,
	`lng` float,
	`placeId` varchar(255),
	`photoUrl` text,
	`rating` float,
	`status` enum('idea','confirmed') NOT NULL DEFAULT 'idea',
	`type` enum('attraction','accommodation') NOT NULL DEFAULT 'attraction',
	`category` varchar(100),
	`website` text,
	`phoneNumber` varchar(50),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attractions_v2_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itinerary_days_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`label` varchar(100),
	`date` varchar(20),
	`startTime` varchar(10),
	`endTime` varchar(10),
	`accommodationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `itinerary_days_v2_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` varchar(20),
	`endDate` varchar(20),
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attractionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_v2_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_vote_v2` UNIQUE(`userId`,`attractionId`)
);
--> statement-breakpoint
ALTER TABLE `attraction_days_v2` ADD CONSTRAINT `attraction_days_v2_attractionId_attractions_v2_id_fk` FOREIGN KEY (`attractionId`) REFERENCES `attractions_v2`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attraction_days_v2` ADD CONSTRAINT `attraction_days_v2_dayId_itinerary_days_v2_id_fk` FOREIGN KEY (`dayId`) REFERENCES `itinerary_days_v2`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attractions_v2` ADD CONSTRAINT `attractions_v2_tripId_trips_id_fk` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attractions_v2` ADD CONSTRAINT `attractions_v2_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `itinerary_days_v2` ADD CONSTRAINT `itinerary_days_v2_tripId_trips_id_fk` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `itinerary_days_v2` ADD CONSTRAINT `itinerary_days_v2_accommodationId_attractions_v2_id_fk` FOREIGN KEY (`accommodationId`) REFERENCES `attractions_v2`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes_v2` ADD CONSTRAINT `votes_v2_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes_v2` ADD CONSTRAINT `votes_v2_attractionId_attractions_v2_id_fk` FOREIGN KEY (`attractionId`) REFERENCES `attractions_v2`(`id`) ON DELETE cascade ON UPDATE no action;