import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllAttractions,
  getAttractionById,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  getAllDaysWithAttractions,
  addAttractionToDay,
  removeAttractionFromDay,
  reorderAttractionInDay,
  toggleVote,
  getUserVotes,
  getVotesForAttractions,
} from "./db";
import { makeRequest } from "./_core/map";

// ─── Attractions Router ───────────────────────────────────────────────────────

const attractionsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const all = await getAllAttractions();
    const ids = all.map((a) => a.id);
    const allVotes = ids.length > 0 ? await getVotesForAttractions(ids) : [];
    const userVoteSet = new Set<number>();
    if (ctx.user) {
      const uv = await getUserVotes(ctx.user.id);
      uv.forEach((v) => userVoteSet.add(v.attractionId));
    }
    const voteCounts = new Map<number, number>();
    allVotes.forEach((v) => {
      voteCounts.set(v.attractionId, (voteCounts.get(v.attractionId) ?? 0) + 1);
    });
    return all.map((a) => ({
      ...a,
      voteCount: voteCounts.get(a.id) ?? 0,
      userVoted: userVoteSet.has(a.id),
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        placeId: z.string().optional(),
        photoUrl: z.string().optional(),
        rating: z.number().optional(),
        category: z.string().optional(),
        website: z.string().optional(),
        phoneNumber: z.string().optional(),
        status: z.enum(["idea", "confirmed"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await createAttraction({
        ...input,
        status: input.status ?? "idea",
        createdBy: ctx.user?.id ?? null,
      });
      return getAttractionById(id);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        photoUrl: z.string().optional(),
        rating: z.number().optional(),
        category: z.string().optional(),
        website: z.string().optional(),
        phoneNumber: z.string().optional(),
        status: z.enum(["idea", "confirmed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAttraction(id, data);
      return getAttractionById(id);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAttraction(input.id);
      return { success: true };
    }),

  toggleStatus: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const attraction = await getAttractionById(input.id);
      if (!attraction) throw new Error("Attraction not found");
      const newStatus = attraction.status === "idea" ? "confirmed" : "idea";
      await updateAttraction(input.id, { status: newStatus });
      return getAttractionById(input.id);
    }),

  vote: protectedProcedure
    .input(z.object({ attractionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const added = await toggleVote(ctx.user.id, input.attractionId);
      return { added };
    }),

  // Search via Google Places API (server-side proxy)
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

  // Get place photo URL
  getPlacePhoto: publicProcedure
    .input(z.object({ photoReference: z.string(), maxWidth: z.number().default(400) }))
    .query(async ({ input }) => {
      const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${input.maxWidth}&photo_reference=${input.photoReference}`;
      return { url };
    }),
});

// ─── Itinerary Router ─────────────────────────────────────────────────────────

const itineraryRouter = router({
  getDays: publicProcedure.query(async () => {
    return getAllDaysWithAttractions();
  }),

  assignToDay: publicProcedure
    .input(
      z.object({
        attractionId: z.number(),
        dayId: z.number(),
        order: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      await addAttractionToDay(input.attractionId, input.dayId, input.order);
      return { success: true };
    }),

  removeFromDay: publicProcedure
    .input(z.object({ attractionId: z.number() }))
    .mutation(async ({ input }) => {
      await removeAttractionFromDay(input.attractionId);
      return { success: true };
    }),

  reorder: publicProcedure
    .input(
      z.object({
        dayId: z.number(),
        orderedAttractionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      await reorderAttractionInDay(input.dayId, input.orderedAttractionIds);
      return { success: true };
    }),

  // Get directions for a day's attractions
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
  attractions: attractionsRouter,
  itinerary: itineraryRouter,
});

export type AppRouter = typeof appRouter;
