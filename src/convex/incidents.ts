import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Incident lifecycle. A citizen/field report always enters as "reported" —
 * it is never automatically treated as confirmed. The monitoring desk moves
 * it through the workflow, and ML output never sets these statuses.
 */
export const INCIDENT_STATUS = {
  REPORTED: "reported",
  UNDER_VERIFICATION: "under_verification",
  VERIFIED: "verified",
  RESPONSE_IN_PROGRESS: "response_in_progress",
  RESOLVED: "resolved",
  FALSE_DUPLICATE: "false_duplicate",
} as const;

export const incidentStatusValidator = v.union(
  v.literal(INCIDENT_STATUS.REPORTED),
  v.literal(INCIDENT_STATUS.UNDER_VERIFICATION),
  v.literal(INCIDENT_STATUS.VERIFIED),
  v.literal(INCIDENT_STATUS.RESPONSE_IN_PROGRESS),
  v.literal(INCIDENT_STATUS.RESOLVED),
  v.literal(INCIDENT_STATUS.FALSE_DUPLICATE),
);

/** Report a new field incident. Always starts as REPORTED, never pre-verified. */
export const reportIncident = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    location: v.string(),
    state: v.optional(v.string()),
    district: v.optional(v.string()),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("moderate"),
        v.literal("high"),
        v.literal("critical"),
      ),
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
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
      state: args.state,
      district: args.district,
      severity: args.severity,
      latitude: args.latitude,
      longitude: args.longitude,
      status: INCIDENT_STATUS.REPORTED,
      createdAt: Date.now(),
    });
  },
});

/** Latest incidents (newest first), with reporter names. */
export const listIncidents = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);

    return Promise.all(
      incidents.map(async (incident) => {
        const reporter = await ctx.db.get(incident.userId);
        return {
          id: incident._id,
          type: incident.type,
          description: incident.description,
          location: incident.location,
          state: incident.state,
          district: incident.district,
          severity: incident.severity,
          status: incident.status ?? INCIDENT_STATUS.REPORTED,
          latitude: incident.latitude,
          longitude: incident.longitude,
          createdAt: incident.createdAt,
          verified: incident.verified ?? false,
          reporterName: reporter?.name ?? "Field reporter",
        };
      }),
    );
  },
});

/** Monitoring desk: advance an incident through its lifecycle. */
export const setIncidentStatus = mutation({
  args: { id: v.id("incidents"), status: incidentStatusValidator },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      verified:
        args.status === INCIDENT_STATUS.VERIFIED ? true : undefined,
      verifiedAt:
        args.status === INCIDENT_STATUS.VERIFIED ? Date.now() : undefined,
    });
  },
});

/** Mark a field report as confirmed by the monitoring desk. */
export const verifyIncident = mutation({
  args: { id: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      verified: true,
      verifiedAt: Date.now(),
      status: INCIDENT_STATUS.VERIFIED,
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