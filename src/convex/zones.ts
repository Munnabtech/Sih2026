import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Default monitored zones, seeded once so the catalog and map start
 * populated. Coordinates are real district monitoring points across the
 * eight North East Region states.
 */
const DEFAULT_ZONES = [
  // Assam (existing Kamrup catalog)
  { code: "NH-27", name: "NH-27 Mile 14–18", state: "Assam", district: "Kamrup", type: "Road slope", risk: 82, latitude: 26.1445, longitude: 91.7362 },
  { code: "4A-11", name: "Sonapur hill road", state: "Assam", district: "Kamrup", type: "Road slope", risk: 78, latitude: 26.1702, longitude: 91.9526 },
  { code: "2B-04", name: "Rangia east face", state: "Assam", district: "Kamrup", type: "Residential hillside", risk: 71, latitude: 26.4681, longitude: 91.6261 },
  { code: "2B-03", name: "Rangia ridgeline", state: "Assam", district: "Kamrup", type: "Residential hillside", risk: 68, latitude: 26.4548, longitude: 91.6049 },
  { code: "3C-07", name: "Kulsi riverbank", state: "Assam", district: "Kamrup", type: "Riverbank", risk: 55, latitude: 25.9822, longitude: 91.3551 },
  { code: "MRZ-02", name: "Mirza bypass cut", state: "Assam", district: "Kamrup", type: "Road slope", risk: 63, latitude: 26.2181, longitude: 91.5026 },
  { code: "CHM-05", name: "Chamaria drainage basin", state: "Assam", district: "Kamrup", type: "Riverbank", risk: 46, latitude: 26.3031, longitude: 91.4512 },
  { code: "HAJ-01", name: "Hajo monastery ridge", state: "Assam", district: "Kamrup", type: "Residential hillside", risk: 39, latitude: 26.2506, longitude: 91.5252 },
  // Sikkim
  { code: "SKM-01", name: "Gangtok ridgeline", state: "Sikkim", district: "Gangtok", type: "Residential hillside", risk: 82, latitude: 27.3389, longitude: 88.6065 },
  // Arunachal Pradesh
  { code: "ARP-01", name: "Tawang approach road", state: "Arunachal Pradesh", district: "Tawang", type: "Road slope", risk: 74, latitude: 27.5747, longitude: 91.8631 },
  { code: "ARP-02", name: "Itanagar hillside", state: "Arunachal Pradesh", district: "Papum Pare", type: "Residential hillside", risk: 58, latitude: 27.0844, longitude: 93.6053 },
  // Meghalaya
  { code: "MEG-01", name: "Shillong escarpment", state: "Meghalaya", district: "East Khasi Hills", type: "Residential hillside", risk: 77, latitude: 25.5788, longitude: 91.8933 },
  { code: "MEG-02", name: "Cherrapunji slopes", state: "Meghalaya", district: "East Khasi Hills", type: "Residential hillside", risk: 66, latitude: 25.251, longitude: 91.7341 },
  // Manipur
  { code: "MNP-01", name: "Imphal valley rim", state: "Manipur", district: "Imphal West", type: "Residential hillside", risk: 52, latitude: 24.817, longitude: 93.9368 },
  // Mizoram
  { code: "MZR-01", name: "Aizawl hill town", state: "Mizoram", district: "Aizawl", type: "Residential hillside", risk: 84, latitude: 23.7271, longitude: 92.7176 },
  // Nagaland
  { code: "NGL-01", name: "Kohima ridgeline", state: "Nagaland", district: "Kohima", type: "Residential hillside", risk: 61, latitude: 25.6751, longitude: 94.1086 },
  { code: "NGL-02", name: "Dimapur cut slopes", state: "Nagaland", district: "Dimapur", type: "Road slope", risk: 48, latitude: 25.8997, longitude: 93.728 },
  // Tripura
  { code: "TRP-01", name: "Agartala southern ridge", state: "Tripura", district: "West Tripura", type: "Residential hillside", risk: 44, latitude: 23.8315, longitude: 91.2868 },
] as const;

/**
 * Insert the default zones once, and backfill state/coordinates on zones
 * seeded before geo fields existed. Preserves any admin edits to risk/status.
 * Returns true when it wrote something.
 */
export const ensureDefaultZones = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("zones").collect();
    const byCode = new Map(existing.map((zone) => [zone.code, zone]));
    let wrote = false;
    const now = Date.now();

    for (const zone of DEFAULT_ZONES) {
      const current = byCode.get(zone.code);
      if (!current) {
        await ctx.db.insert("zones", {
          ...zone,
          status: "monitored",
          lastUpdated: now,
        });
        wrote = true;
      } else if (
        current.latitude === undefined ||
        current.longitude === undefined ||
        current.state === undefined
      ) {
        await ctx.db.patch(current._id, {
          ...(current.latitude === undefined ? { latitude: zone.latitude } : {}),
          ...(current.longitude === undefined ? { longitude: zone.longitude } : {}),
          ...(current.state === undefined ? { state: zone.state } : {}),
        });
        wrote = true;
      }
    }
    return wrote;
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