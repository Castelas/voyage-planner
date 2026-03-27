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
