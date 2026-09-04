import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Report a new field incident. Returns the new incident id. */
export const reportIncident = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("You must be signed in to report an incident.");
    }
    return await ctx.db.insert("incidents", {
      userId,
      type: args.type,
      description: args.description,
      location: args.location,
      createdAt: Date.now(),
    });
  },
});

/** Latest district-wide field reports (newest first), with reporter names. */
export const listIncidents = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(20);

    return Promise.all(
      incidents.map(async (incident) => {
        const reporter = await ctx.db.get(incident.userId);
        return {
          id: incident._id,
          type: incident.type,
          description: incident.description,
          location: incident.location,
          createdAt: incident.createdAt,
          verified: incident.verified ?? false,
          reporterName: reporter?.name ?? "Field reporter",
        };
      }),
    );
  },
});

/** Mark a field report as confirmed by the monitoring desk. */
export const verifyIncident = mutation({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      verified: true,
      verifiedAt: Date.now(),
    });
  },
});

/** Remove a field report from the district feed. */
export const deleteIncident = mutation({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});