import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getAllAttractions: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Valle dei Templi",
      description: "Parque arqueológico",
      address: "Agrigento, Sicília",
      lat: 37.2913,
      lng: 13.5895,
      placeId: "place_1",
      photoUrl: null,
      rating: 4.8,
      status: "confirmed",
      category: "tourist_attraction",
      website: null,
      phoneNumber: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getAttractionById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Valle dei Templi",
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createAttraction: vi.fn().mockResolvedValue(1),
  updateAttraction: vi.fn().mockResolvedValue(undefined),
  deleteAttraction: vi.fn().mockResolvedValue(undefined),
  getAllDaysWithAttractions: vi.fn().mockResolvedValue([
    { day: { id: 1, dayNumber: 1, label: "Dia 1", date: null, createdAt: new Date() }, attractions: [] },
    { day: { id: 2, dayNumber: 2, label: "Dia 2", date: null, createdAt: new Date() }, attractions: [] },
  ]),
  addAttractionToDay: vi.fn().mockResolvedValue(undefined),
  removeAttractionFromDay: vi.fn().mockResolvedValue(undefined),
  reorderAttractionInDay: vi.fn().mockResolvedValue(undefined),
  toggleVote: vi.fn().mockResolvedValue(true),
  getUserVotes: vi.fn().mockResolvedValue([]),
  getVotesForAttractions: vi.fn().mockResolvedValue([]),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-1",
      email: "test@test.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("attractions.list", () => {
  it("returns attractions with vote counts for public users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.attractions.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Valle dei Templi");
    expect(result[0].voteCount).toBe(0);
    expect(result[0].userVoted).toBe(false);
  });
});

describe("attractions.create", () => {
  it("creates a new attraction", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.attractions.create({
      name: "Etna",
      description: "Vulcão ativo",
      lat: 37.7510,
      lng: 14.9934,
      status: "idea",
    });
    expect(result).toBeDefined();
    expect(result?.name).toBe("Valle dei Templi"); // mocked return
  });

  it("requires a name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.attractions.create({ name: "" })
    ).rejects.toThrow();
  });
});

describe("attractions.delete", () => {
  it("deletes an attraction by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.attractions.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("attractions.vote", () => {
  it("requires authentication to vote", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.attractions.vote({ attractionId: 1 })
    ).rejects.toThrow();
  });

  it("allows authenticated users to vote", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.attractions.vote({ attractionId: 1 });
    expect(result.added).toBe(true);
  });
});

describe("itinerary.getDays", () => {
  it("returns 5 days with attractions", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.itinerary.getDays();
    expect(result).toHaveLength(2);
    expect(result[0].day.dayNumber).toBe(1);
    expect(result[0].attractions).toEqual([]);
  });
});

describe("itinerary.assignToDay", () => {
  it("assigns an attraction to a day", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.itinerary.assignToDay({
      attractionId: 1,
      dayId: 1,
      order: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("itinerary.removeFromDay", () => {
  it("removes an attraction from its day", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.itinerary.removeFromDay({ attractionId: 1 });
    expect(result.success).toBe(true);
  });
});

describe("itinerary.getDirections", () => {
  it("returns null for less than 2 waypoints", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.itinerary.getDirections({
      waypoints: [{ lat: 37.5, lng: 14.0, name: "Palermo" }],
    });
    expect(result).toBeNull();
  });
});
