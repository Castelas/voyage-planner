import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getTripsByUserId,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  getAttractionsByTrip,
  createAttractionV2,
  updateAttractionV2,
  deleteAttractionV2,
  getDaysByTrip,
  updateItineraryDay,
  getDayWithAttractionsV2,
  addAttractionToDayV2,
  removeAttractionFromDayV2,
  reorderAttractionInDayV2,
  toggleVoteV2,
  getUserVotesV2,
  addCollaborator,
  removeCollaborator,
  getCollaboratorsByTrip,
  getUserTripsAsCollaborator,
  getCollaboratorRole,
  getDb,
} from "./db";
import { makeRequest } from "./_core/map";

// ─── Trips Router ─────────────────────────────────────────────────────────────

const tripsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTripsByUserId(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tripId = await createTrip({
        ...input,
        ownerId: ctx.user.id,
      });
      // Create 5 default days
      const db = await (await import("./db")).getDb();
      if (db) {
        const { itineraryDaysV2 } = await import("../drizzle/schema");
        for (let i = 1; i <= 5; i++) {
          await db.insert(itineraryDaysV2).values({
            tripId,
            dayNumber: i,
            label: `Dia ${i}`,
          });
        }
      }
      return getTripById(tripId);
    }),

  get: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      return trip;
    }),

  update: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      const { tripId, ...data } = input;
      await updateTrip(tripId, data);
      return getTripById(tripId);
    }),

  delete: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      await deleteTrip(input.tripId);
      return { success: true };
    }),
});

// ─── Attractions Router (V2) ──────────────────────────────────────────────────

const attractionsRouter = router({
  listByTrip: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      const attractions = await getAttractionsByTrip(input.tripId);
      const ids = attractions.map((a) => a.id);
      const userVotes = ids.length > 0 ? await getUserVotesV2(ctx.user.id) : [];
      const userVoteSet = new Set(userVotes.map((v) => v.attractionId));
      return attractions.map((a) => ({
        ...a,
        userVoted: userVoteSet.has(a.id),
      }));
    }),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        placeId: z.string().optional(),
        photoUrl: z.string().optional(),
        rating: z.number().optional(),
        type: z.enum(["attraction", "accommodation"]).default("attraction"),
        category: z.string().optional(),
        website: z.string().optional(),
        phoneNumber: z.string().optional(),
        status: z.enum(["idea", "confirmed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      const { tripId, ...data } = input;
      const id = await createAttractionV2({
        ...data,
        tripId,
        status: data.status ?? "idea",
        createdBy: ctx.user.id,
      });
      const db = await (await import("./db")).getDb();
      if (db) {
        const { attractionsV2 } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const result = await db.select().from(attractionsV2).where(eq(attractionsV2.id, id)).limit(1);
        return result[0];
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        photoUrl: z.string().optional(),
        rating: z.number().optional(),
        status: z.enum(["idea", "confirmed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAttractionV2(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAttractionV2(input.id);
      return { success: true };
    }),

  vote: protectedProcedure
    .input(z.object({ attractionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const added = await toggleVoteV2(ctx.user.id, input.attractionId);
      return { added };
    }),

  searchPlaces: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const data = await makeRequest<{
          results: Array<{
            place_id: string;
            name: string;
            formatted_address: string;
            geometry: { location: { lat: number; lng: number } };
            rating?: number;
            photos?: Array<{ photo_reference: string }>;
            types?: string[];
          }>;
          status: string;
        }>("/maps/api/place/textsearch/json", {
          query: input.query + " Sicilia",
          language: "pt",
        });
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          console.error("Places API error:", data.status);
          return [];
        }
        return (data.results ?? []).slice(0, 8).map((r) => ({
          placeId: r.place_id,
          name: r.name,
          address: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          rating: r.rating,
          photoReference: r.photos?.[0]?.photo_reference,
          category: r.types?.[0],
        }));
      } catch (err) {
        console.error("searchPlaces error:", err);
        return [];
      }
    }),

  getPlacePhoto: publicProcedure
    .input(z.object({ photoReference: z.string(), maxWidth: z.number().default(400) }))
    .query(async ({ input }) => {
      const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${input.maxWidth}&photo_reference=${input.photoReference}`;
      return { url };
    }),
});

// ─── Itinerary Router (V2) ────────────────────────────────────────────────────

const itineraryRouter = router({
  getDays: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      return getDaysByTrip(input.tripId);
    }),

  updateDay: protectedProcedure
    .input(
      z.object({
        dayId: z.number(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        accommodationId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { dayId, ...data } = input;
      await updateItineraryDay(dayId, data);
      return { success: true };
    }),

  assignToDay: protectedProcedure
    .input(
      z.object({
        attractionId: z.number(),
        dayId: z.number(),
        order: z.number().default(0),
        time: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await addAttractionToDayV2(input.attractionId, input.dayId, input.order, input.time);
      return { success: true };
    }),

  removeFromDay: protectedProcedure
    .input(z.object({ attractionId: z.number() }))
    .mutation(async ({ input }) => {
      await removeAttractionFromDayV2(input.attractionId);
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        dayId: z.number(),
        orderedAttractionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      await reorderAttractionInDayV2(input.dayId, input.orderedAttractionIds);
      return { success: true };
    }),

  getDirections: publicProcedure
    .input(
      z.object({
        waypoints: z.array(
          z.object({
            lat: z.number(),
            lng: z.number(),
            name: z.string(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      if (input.waypoints.length < 2) return null;
      try {
        const origin = `${input.waypoints[0].lat},${input.waypoints[0].lng}`;
        const destination = `${input.waypoints[input.waypoints.length - 1].lat},${input.waypoints[input.waypoints.length - 1].lng}`;
        const middle = input.waypoints.slice(1, -1);
        const waypointsStr = middle
          .map((w) => `${w.lat},${w.lng}`)
          .join("|");
        const params: Record<string, string> = {
          origin,
          destination,
          mode: "driving",
          language: "pt",
        };
        if (waypointsStr) params.waypoints = waypointsStr;
        const data = await makeRequest<{
          routes: Array<{
            legs: Array<{
              distance: { text: string; value: number };
              duration: { text: string; value: number };
              start_address: string;
              end_address: string;
            }>;
            overview_polyline: { points: string };
          }>;
          status: string;
        }>("/maps/api/directions/json", params);
        if (data.status !== "OK" || !data.routes[0]) return null;
        const route = data.routes[0];
        const totalDistance = route.legs.reduce((sum, l) => sum + l.distance.value, 0);
        const totalDuration = route.legs.reduce((sum, l) => sum + l.duration.value, 0);
        return {
          polyline: route.overview_polyline.points,
          legs: route.legs.map((l) => ({
            distance: l.distance.text,
            duration: l.duration.text,
          })),
          totalDistance: (totalDistance / 1000).toFixed(1) + " km",
          totalDuration: Math.round(totalDuration / 60) + " min",
        };
      } catch (err) {
        console.error("getDirections error:", err);
        return null;
      }
    }),
});

// ─── Export Router ────────────────────────────────────────────────────────────

const exportRouter = router({
  exportToGoogleDrive: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Trip not found");
      
      // Generate document content
      let content = `# Roteiro de Viagem: ${trip.name}\n\n`;
      if (trip.description) content += `${trip.description}\n\n`;
      if (trip.startDate) content += `**Data:** ${trip.startDate} a ${trip.endDate}\n\n`;
      
      const days = await getDaysByTrip(input.tripId);
      for (const day of days) {
        content += `## ${day.label || `Dia ${day.dayNumber}`}\n`;
        if (day.date) content += `**Data:** ${day.date}\n`;
        if (day.startTime) content += `**Horário:** ${day.startTime} - ${day.endTime || "Aberto"}\n`;
        
        const dayData = await getDayWithAttractionsV2(day.id);
        if (dayData?.attractions && dayData.attractions.length > 0) {
          content += `\n### Atrações\n`;
          for (const attr of dayData.attractions) {
            content += `- **${attr.name}** (${attr.type})\n`;
            if (attr.time) content += `  - Horário: ${attr.time}\n`;
            if (attr.address) content += `  - Endereço: ${attr.address}\n`;
            if (attr.rating) content += `  - Avaliação: ${attr.rating}⭐\n`;
          }
        }
        
        if (day.accommodationId) {
          const db = await (await import("./db")).getDb();
          if (db) {
            const { attractionsV2 } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const acc = await db.select().from(attractionsV2).where(eq(attractionsV2.id, day.accommodationId)).limit(1);
            if (acc[0]) {
              content += `\n### Alojamento\n`;
              content += `- **${acc[0].name}**\n`;
              if (acc[0].address) content += `  - Endereço: ${acc[0].address}\n`;
              if (acc[0].phoneNumber) content += `  - Telefone: ${acc[0].phoneNumber}\n`;
            }
          }
        }
        
        content += `\n`;
      }
      
      // For now, return the content as a string
      // In production, this would integrate with Google Drive API
      return {
        success: true,
        documentContent: content,
        message: "Documento gerado. Integração com Google Drive em desenvolvimento.",
      };
    }),
});

// ─── Collaborators Router ────────────────────────────────────────────────────

const collaboratorsRouter = router({
  add: protectedProcedure
    .input(
      z.object({
        tripId: z.number(),
        userEmail: z.string().email(),
        role: z.enum(["owner", "editor", "viewer"]).default("editor"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Not authorized");
      // In production, lookup user by email
      // For now, just return success
      return { success: true };
    }),

  list: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Not authorized");
      return getCollaboratorsByTrip(input.tripId);
    }),

  remove: protectedProcedure
    .input(z.object({ tripId: z.number(), userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const trip = await getTripById(input.tripId);
      if (!trip || trip.ownerId !== ctx.user.id) throw new Error("Not authorized");
      await removeCollaborator(input.tripId, input.userId);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  trips: tripsRouter,
  attractions: attractionsRouter,
  itinerary: itineraryRouter,
  export: exportRouter,
  collaborators: collaboratorsRouter,
});

export type AppRouter = typeof appRouter;
