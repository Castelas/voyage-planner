import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  attractions,
  InsertAttraction,
  itineraryDays,
  attractionDays,
  votes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Attractions ────────────────────────────────────────────────────────────

export async function getAllAttractions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attractions).orderBy(desc(attractions.createdAt));
}

export async function getAttractionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(attractions).where(eq(attractions.id, id)).limit(1);
  return result[0];
}

export async function createAttraction(data: InsertAttraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(attractions).values(data);
  return result.insertId as number;
}

export async function updateAttraction(id: number, data: Partial<InsertAttraction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(attractions).set(data).where(eq(attractions.id, id));
}

export async function deleteAttraction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attractions).where(eq(attractions.id, id));
}

// ─── Itinerary Days ──────────────────────────────────────────────────────────

export async function getAllDays() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(itineraryDays).orderBy(asc(itineraryDays.dayNumber));
}

export async function getDayWithAttractions(dayId: number) {
  const db = await getDb();
  if (!db) return null;
  const dayRows = await db.select().from(itineraryDays).where(eq(itineraryDays.id, dayId)).limit(1);
  if (!dayRows[0]) return null;
  const adRows = await db
    .select()
    .from(attractionDays)
    .where(eq(attractionDays.dayId, dayId))
    .orderBy(asc(attractionDays.order));
  if (adRows.length === 0) return { day: dayRows[0], attractions: [] };
  const ids = adRows.map((r) => r.attractionId);
  const attrRows = await db.select().from(attractions).where(inArray(attractions.id, ids));
  const attrMap = new Map(attrRows.map((a) => [a.id, a]));
  const orderedAttractions = adRows.map((ad) => ({
    ...attrMap.get(ad.attractionId)!,
    order: ad.order,
    adId: ad.id,
  }));
  return { day: dayRows[0], attractions: orderedAttractions };
}

export async function getAllDaysWithAttractions() {
  const db = await getDb();
  if (!db) return [];
  const days = await db.select().from(itineraryDays).orderBy(asc(itineraryDays.dayNumber));
  const adRows = await db.select().from(attractionDays).orderBy(asc(attractionDays.order));
  if (adRows.length === 0) return days.map((d) => ({ day: d, attractions: [] }));
  const ids = Array.from(new Set(adRows.map((r) => r.attractionId)));
  const attrRows = await db.select().from(attractions).where(inArray(attractions.id, ids));
  const attrMap = new Map(attrRows.map((a) => [a.id, a]));
  return days.map((d) => ({
    day: d,
    attractions: adRows
      .filter((ad) => ad.dayId === d.id)
      .map((ad) => ({ ...attrMap.get(ad.attractionId)!, order: ad.order, adId: ad.id }))
      .filter((a) => a.id != null),
  }));
}

export async function addAttractionToDay(attractionId: number, dayId: number, order: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove from any existing day first
  await db.delete(attractionDays).where(eq(attractionDays.attractionId, attractionId));
  await db.insert(attractionDays).values({ attractionId, dayId, order });
}

export async function removeAttractionFromDay(attractionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(attractionDays).where(eq(attractionDays.attractionId, attractionId));
}

export async function reorderAttractionInDay(dayId: number, orderedAttractionIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (let i = 0; i < orderedAttractionIds.length; i++) {
    await db
      .update(attractionDays)
      .set({ order: i })
      .where(
        and(
          eq(attractionDays.dayId, dayId),
          eq(attractionDays.attractionId, orderedAttractionIds[i])
        )
      );
  }
}

// ─── Votes ───────────────────────────────────────────────────────────────────

export async function getVotesForAttractions(attractionIds: number[]) {
  const db = await getDb();
  if (!db || attractionIds.length === 0) return [];
  return db.select().from(votes).where(inArray(votes.attractionId, attractionIds));
}

export async function getUserVotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(votes).where(eq(votes.userId, userId));
}

export async function toggleVote(userId: number, attractionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.attractionId, attractionId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(votes)
      .where(and(eq(votes.userId, userId), eq(votes.attractionId, attractionId)));
    return false; // removed
  } else {
    await db.insert(votes).values({ userId, attractionId });
    return true; // added
  }
}
