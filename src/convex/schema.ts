import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // field-reported incidents shared across the district feed
    incidents: defineTable({
      userId: v.id("users"), // reporter
      type: v.string(), // e.g. "Landslide", "Road slip", "Flash flood"
      description: v.string(),
      location: v.string(),
      createdAt: v.number(),
      verified: v.optional(v.boolean()), // confirmed by the monitoring desk
      verifiedAt: v.optional(v.number()),
    }).index("by_createdAt", ["createdAt"]),

    // monitored risk zones — the catalog of what Dharanetra watches
    zones: defineTable({
      code: v.string(), // e.g. "4A-11"
      name: v.string(),
      state: v.optional(v.string()), // NER state, e.g. "Assam"
      district: v.string(),
      type: v.string(), // e.g. "Road slope", "Residential hillside", "Riverbank"
      risk: v.number(), // 0-100
      status: v.union(v.literal("monitored"), v.literal("standby")),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      lastUpdated: v.number(),
    }).index("by_code", ["code"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
