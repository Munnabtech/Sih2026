import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Default monitored zones, seeded once so the catalog starts populated. */
const DEFAULT_ZONES = [
  { code: "NH-27", name: "NH-27 Mile 14–18", district: "Kamrup", type: "Road slope", risk: 82 },
  { code: "4A-11", name: "Sonapur hill road", district: "Kamrup", type: "Road slope", risk: 78 },
  { code: "2B-04", name: "Rangia east face", district: "Kamrup", type: "Residential hillside", risk: 71 },
  { code: "2B-03", name: "Rangia ridgeline", district: "Kamrup", type: "Residential hillside", risk: 68 },
  { code: "3C-07", name: "Kulsi riverbank", district: "Kamrup", type: "Riverbank", risk: 55 },
  { code: "MRZ-02", name: "Mirza bypass cut", district: "Kamrup", type: "Road slope", risk: 63 },
  { code: "CHM-05", name: "Chamaria drainage basin", district: "Kamrup", type: "Riverbank", risk: 46 },
  { code: "HAJ-01", name: "Hajo monastery ridge", district: "Kamrup", type: "Residential hillside", risk: 39 },
] as const;

/** Insert the default zones once. Returns true when it seeded the table. */
export const ensureDefaultZones = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("zones").collect();
    if (existing.length > 0) {
      return false;
    }
    const now = Date.now();
    for (const zone of DEFAULT_ZONES) {
      await ctx.db.insert("zones", { ...zone, status: "monitored", lastUpdated: now });
    }
    return true;
  },
});

/** Update a zone's risk score and/or monitoring status. */
export const updateZone = mutation({
  args: {
    id: v.id("zones"),
    risk: v.optional(v.number()),
    status: v.optional(v.union(v.literal("monitored"), v.literal("standby"))),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      ...(args.risk !== undefined ? { risk: args.risk } : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
      lastUpdated: Date.now(),
    });
  },
});

/** All monitored zones, ordered by risk score (highest first). */
export const listZones = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("zones").order("desc").take(50);
  },
});