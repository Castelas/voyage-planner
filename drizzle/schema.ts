import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  unique,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Atrações turísticas
export const attractions = mysqlTable("attractions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  placeId: varchar("placeId", { length: 255 }),
  photoUrl: text("photoUrl"),
  rating: float("rating"),
  status: mysqlEnum("status", ["idea", "confirmed"]).default("idea").notNull(),
  category: varchar("category", { length: 100 }),
  website: text("website"),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attraction = typeof attractions.$inferSelect;
export type InsertAttraction = typeof attractions.$inferInsert;

// Dias do itinerário (1-5)
export const itineraryDays = mysqlTable("itinerary_days", {
  id: int("id").autoincrement().primaryKey(),
  dayNumber: int("dayNumber").notNull(), // 1-5
  label: varchar("label", { length: 100 }),
  date: varchar("date", { length: 20 }), // ISO date string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ItineraryDay = typeof itineraryDays.$inferSelect;

// Relação atração ↔ dia do itinerário
export const attractionDays = mysqlTable("attraction_days", {
  id: int("id").autoincrement().primaryKey(),
  attractionId: int("attractionId")
    .notNull()
    .references(() => attractions.id, { onDelete: "cascade" }),
  dayId: int("dayId")
    .notNull()
    .references(() => itineraryDays.id, { onDelete: "cascade" }),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttractionDay = typeof attractionDays.$inferSelect;

// Votos / favoritos por usuário
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  attractionId: int("attractionId")
    .notNull()
    .references(() => attractions.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueVote: unique("unique_vote").on(table.userId, table.attractionId),
}));

export type Vote = typeof votes.$inferSelect;

// Viagens (suporte a múltiplas viagens por usuário)
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: varchar("startDate", { length: 20 }), // ISO date
  endDate: varchar("endDate", { length: 20 }), // ISO date
  numDays: int("numDays").default(5), // Número de dias da viagem
  location: varchar("location", { length: 255 }), // Local da viagem (para o mapa)
  locationLat: float("locationLat"), // Latitude do local
  locationLng: float("locationLng"), // Longitude do local
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

// Atualizar attractions para referenciar trips
export const attractionsV2 = mysqlTable("attractions_v2", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  lat: float("lat"),
  lng: float("lng"),
  placeId: varchar("placeId", { length: 255 }),
  photoUrl: text("photoUrl"),
  rating: float("rating"),
  status: mysqlEnum("status", ["idea", "confirmed"]).default("idea").notNull(),
  type: mysqlEnum("type", ["attraction", "accommodation"]).default("attraction").notNull(),
  category: varchar("category", { length: 100 }),
  website: text("website"),
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttractionV2 = typeof attractionsV2.$inferSelect;
export type InsertAttractionV2 = typeof attractionsV2.$inferInsert;

// Dias do itinerário com horários
export const itineraryDaysV2 = mysqlTable("itinerary_days_v2", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  dayNumber: int("dayNumber").notNull(), // 1-5
  label: varchar("label", { length: 100 }),
  date: varchar("date", { length: 20 }), // ISO date string
  startTime: varchar("startTime", { length: 10 }), // HH:MM
  endTime: varchar("endTime", { length: 10 }), // HH:MM
  accommodationId: int("accommodationId").references(() => attractionsV2.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ItineraryDayV2 = typeof itineraryDaysV2.$inferSelect;

// Relação atração ↔ dia com horário
export const attractionDaysV2 = mysqlTable("attraction_days_v2", {
  id: int("id").autoincrement().primaryKey(),
  attractionId: int("attractionId")
    .notNull()
    .references(() => attractionsV2.id, { onDelete: "cascade" }),
  dayId: int("dayId")
    .notNull()
    .references(() => itineraryDaysV2.id, { onDelete: "cascade" }),
  order: int("order").default(0).notNull(),
  time: varchar("time", { length: 10 }), // HH:MM - horário da atração no dia
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttractionDayV2 = typeof attractionDaysV2.$inferSelect;

// Votos / favoritos por usuário (atualizado para v2)
export const votesV2 = mysqlTable("votes_v2", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  attractionId: int("attractionId")
    .notNull()
    .references(() => attractionsV2.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueVote: unique("unique_vote_v2").on(table.userId, table.attractionId),
}));

export type VoteV2 = typeof votesV2.$inferSelect;

// Colaboradores de viagem
export const tripCollaborators = mysqlTable("trip_collaborators", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueCollaborator: unique("unique_collaborator").on(table.tripId, table.userId),
}));

export type TripCollaborator = typeof tripCollaborators.$inferSelect;
export type InsertTripCollaborator = typeof tripCollaborators.$inferInsert;
