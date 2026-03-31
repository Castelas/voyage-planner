CREATE TABLE `trip_collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','viewer') NOT NULL DEFAULT 'editor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trip_collaborators_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_collaborator` UNIQUE(`tripId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `trips` ADD `numDays` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `trips` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `trips` ADD `locationLat` float;--> statement-breakpoint
ALTER TABLE `trips` ADD `locationLng` float;--> statement-breakpoint
ALTER TABLE `trip_collaborators` ADD CONSTRAINT `trip_collaborators_tripId_trips_id_fk` FOREIGN KEY (`tripId`) REFERENCES `trips`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trip_collaborators` ADD CONSTRAINT `trip_collaborators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;