import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("trips router", () => {
  it("creates a new trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.trips.create({
      name: "Sicília 2025",
      description: "5 dias explorando a Sicília",
    });

    expect(result).toBeDefined();
    expect(result?.name).toBe("Sicília 2025");
    expect(result?.description).toBe("5 dias explorando a Sicília");
    expect(result?.ownerId).toBe(ctx.user.id);
  });

  it("lists trips for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip first
    await caller.trips.create({
      name: "Trip 1",
    });

    // List trips
    const trips = await caller.trips.list();

    expect(Array.isArray(trips)).toBe(true);
    expect(trips.length).toBeGreaterThan(0);
    // Check that at least one trip exists (may be from previous tests)
    expect(trips.some((t) => t.name === "Trip 1")).toBe(true);
  });

  it("gets a specific trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const created = await caller.trips.create({
      name: "Test Trip",
    });

    if (!created?.id) throw new Error("Trip creation failed");

    // Get the trip
    const trip = await caller.trips.get({ tripId: created.id });

    expect(trip).toBeDefined();
    expect(trip?.name).toBe("Test Trip");
    expect(trip?.id).toBe(created.id);
  });

  it("updates a trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const created = await caller.trips.create({
      name: "Original Name",
    });

    if (!created?.id) throw new Error("Trip creation failed");

    // Update it
    const updated = await caller.trips.update({
      tripId: created.id,
      name: "Updated Name",
    });

    expect(updated?.name).toBe("Updated Name");
  });

  it("deletes a trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const created = await caller.trips.create({
      name: "To Delete",
    });

    if (!created?.id) throw new Error("Trip creation failed");

    // Delete it
    const result = await caller.trips.delete({ tripId: created.id });

    expect(result.success).toBe(true);
  });

  it("prevents access to other users' trips", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const { ctx: ctx2 } = createAuthContext(2);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a trip
    const created = await caller1.trips.create({
      name: "Private Trip",
    });

    if (!created?.id) throw new Error("Trip creation failed");

    // User 2 tries to access it
    try {
      await caller2.trips.get({ tripId: created.id });
      expect.fail("Should have thrown an error");
    } catch (err) {
      expect((err as Error).message).toContain("Trip not found");
    }
  });
});

describe("attractions router", () => {
  it("creates an attraction for a trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip first
    const trip = await caller.trips.create({
      name: "Test Trip",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Create an attraction
    const attraction = await caller.attractions.create({
      tripId: trip.id,
      name: "Valle dei Templi",
      address: "Agrigento, Sicily",
      lat: 37.2871,
      lng: 13.5856,
      type: "attraction",
      status: "idea",
    });

    expect(attraction).toBeDefined();
    expect(attraction?.name).toBe("Valle dei Templi");
    expect(attraction?.type).toBe("attraction");
  });

  it("lists attractions for a trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const trip = await caller.trips.create({
      name: "Test Trip",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Create an attraction
    await caller.attractions.create({
      tripId: trip.id,
      name: "Attraction 1",
      type: "attraction",
    });

    // List attractions
    const attractions = await caller.attractions.listByTrip({ tripId: trip.id });

    expect(Array.isArray(attractions)).toBe(true);
    expect(attractions.length).toBeGreaterThan(0);
    expect(attractions[0]?.name).toBe("Attraction 1");
  });

  it("creates an accommodation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const trip = await caller.trips.create({
      name: "Test Trip",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Create an accommodation
    const accommodation = await caller.attractions.create({
      tripId: trip.id,
      name: "Hotel Palermo",
      address: "Palermo, Sicily",
      type: "accommodation",
      phoneNumber: "+39 091 123 4567",
    });

    expect(accommodation?.type).toBe("accommodation");
    expect(accommodation?.phoneNumber).toBe("+39 091 123 4567");
  });
});

describe("itinerary router", () => {
  it("gets days for a trip", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const trip = await caller.trips.create({
      name: "Test Trip for Days",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Get days
    const days = await caller.itinerary.getDays({ tripId: trip.id });

    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBe(5); // Should have 5 default days
    expect(days[0]?.dayNumber).toBe(1);
  });

  it("updates a day with times", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const trip = await caller.trips.create({
      name: "Test Trip for Updates",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Get days
    const days = await caller.itinerary.getDays({ tripId: trip.id });
    const firstDay = days[0];

    if (!firstDay) throw new Error("No days found");

    // Update the day
    const result = await caller.itinerary.updateDay({
      dayId: firstDay.id,
      startTime: "09:00",
      endTime: "18:00",
    });

    expect(result.success).toBe(true);
  });
});

describe("export router", () => {
  it("exports trip to document", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a trip
    const trip = await caller.trips.create({
      name: "Sicília Export Test",
      description: "5 dias na Sicília",
    });

    if (!trip?.id) throw new Error("Trip creation failed");

    // Export it
    const result = await caller.export.exportToGoogleDrive({
      tripId: trip.id,
    });

    expect(result.success).toBe(true);
    expect(result.documentContent).toContain("Sicília Export Test");
    expect(result.documentContent).toContain("5 dias na Sicília");
  });
});
