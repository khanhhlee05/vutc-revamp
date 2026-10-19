import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Lifecycle of an event. Mirrors the legacy integer status 1..9. */
export const eventStatusEnum = pgEnum("event_status", [
  "requested", // 1  client submitted, awaiting review
  "confirmed", // 2  approved, quote sent, not yet open for staff signup
  "open", // 3  staff can sign up
  "completed", // 4  timesheet submitted
  "payroll_created", // 5  included in a payroll batch
  "billed", // 6  bill sent to client
  "paid", // 7  payment received
  "cancelled", // 8  cancelled or denied
  "archived", // 9  hidden from normal lists
]);

/** Role a staff member holds on a specific event. */
export const staffRoleEnum = pgEnum("staff_role", [
  "event_staff",
  "senior_staff",
  "aht",
  "lht",
  "vht",
  "dj",
  "spot",
  "camera",
  "runner",
  "rental_pickup",
  "rental_dropoff",
]);

/** Permission roles attached to a user account. */
export const userRoleEnum = pgEnum("user_role", [
  "exec",
  "vpep", // VP of event production
  "vpf", // VP of finance
  "event_mgmt",
  "bus_mgmt",
  "pers_mgmt",
  "senior",
  "aht",
  "lht",
  "vht",
  "dj",
]);

export const packageCategoryEnum = pgEnum("package_category", [
  "audio",
  "lighting",
  "video",
  "op_time",
  "other",
]);

/**
 * How a package's revenue is routed in the pay split. Replaces the legacy
 * "name contains 'Audio Op'" substring rules from timesheetAction.php.
 */
export const payRoutingEnum = pgEnum("pay_routing", [
  "standard", // goes into the set/strike pool after VUTC share
  "op_audio",
  "op_light",
  "op_video",
  "op_dj",
  "op_spot",
  "op_camera",
  "op_runner",
  "wireless", // 100% to VUTC
  "power", // 100% to VUTC
  "rental", // split between rental pickup and dropoff drivers
]);

export const notificationAudienceEnum = pgEnum("notification_audience", [
  "staff",
  "client",
]);

// ---------------------------------------------------------------------------
// Auth tables (owned by better-auth; column names match its defaults)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/** One-to-one extension of the auth user with club-specific attributes. */
export const staffProfiles = pgTable("staff_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone"),
  gradYear: integer("grad_year"),
  bannerId: text("banner_id"),
  residence: text("residence"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  /** False while the account is suspended or pending approval. */
  isActive: boolean("is_active").notNull().default(true),
  /** Pending approval by personnel management. */
  isApproved: boolean("is_approved").notNull().default(false),
  receivesNotifications: boolean("receives_notifications")
    .notNull()
    .default(true),
  lastTrainingAt: date("last_training_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    grantedById: text("granted_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

// ---------------------------------------------------------------------------
// Clients and packages
// ---------------------------------------------------------------------------

/** A client organization (legacy table: clients). */
export const organizations = pgTable(
  "organizations",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    legacyId: integer("legacy_id").unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    /** Flag set by event management when the org needs special handling. */
    alertFlag: boolean("alert_flag").notNull().default(false),
    alertDate: date("alert_date"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("organizations_name_idx").on(t.name)],
);

/** Price list entry (legacy table: pricing). */
export const packages = pgTable("packages", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  legacyId: integer("legacy_id").unique(),
  name: text("name").notNull().unique(),
  category: packageCategoryEnum("category").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull().default(""),
  payRouting: payRoutingEnum("pay_routing").notNull().default("standard"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const events = pgTable(
  "events",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    legacyId: integer("legacy_id").unique(),
    /** Unguessable token for the public client brief link. */
    publicToken: text("public_token").notNull().unique(),
    status: eventStatusEnum("status").notNull().default("requested"),

    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    name: text("name").notNull(),
    /** Organization name as typed on the request form. */
    orgName: text("org_name").notNull(),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    advisorName: text("advisor_name").notNull().default(""),
    advisorEmail: text("advisor_email").notNull().default(""),
    /** Villanova budget account index for billing. */
    accountIndex: text("account_index").notNull().default(""),
    isStudentOrg: boolean("is_student_org").notNull().default(false),

    location: text("location").notNull(),
    /** Calendar date of the event in America/New_York. */
    eventDate: date("event_date").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    loadInAt: timestamp("load_in_at", { withTimezone: true }),
    soundcheckAt: timestamp("soundcheck_at", { withTimezone: true }),
    reservationStartAt: timestamp("reservation_start_at", {
      withTimezone: true,
    }),
    reservationEndAt: timestamp("reservation_end_at", { withTimezone: true }),
    expectedAttendance: text("expected_attendance"),
    /** Checklist items chosen on the request form, e.g. "Wireless Microphones". */
    needs: text("needs")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    description: text("description").notNull().default(""),
    attachmentUrl: text("attachment_url"),
    /** Internal notes from event management. */
    notes: text("notes").notNull().default(""),
    /** Notes written by the head tech on the timesheet. */
    htNotes: text("ht_notes").notNull().default(""),
    planningNotes: text("planning_notes").notNull().default(""),
    quoteSentNote: text("quote_sent_note").notNull().default(""),

    // Staffing slots
    crewSlots: integer("crew_slots").notNull().default(0),
    seniorStaffSlots: integer("senior_staff_slots").notNull().default(0),
    ahtSlots: integer("aht_slots").notNull().default(0),
    lhtSlots: integer("lht_slots").notNull().default(0),
    vhtSlots: integer("vht_slots").notNull().default(0),
    djSlots: integer("dj_slots").notNull().default(0),
    spotSlots: integer("spot_slots").notNull().default(0),
    cameraSlots: integer("camera_slots").notNull().default(0),
    runnerSlots: integer("runner_slots").notNull().default(0),

    // Money
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    vutcShare: numeric("vutc_share", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    rentalPrice: numeric("rental_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    rentalDescription: text("rental_description").notNull().default(""),
    rentalsOrdered: boolean("rentals_ordered").notNull().default(false),
    payrollId: integer("payroll_id"),

    // Flags
    /** Open automatically for signup on openAt (evening cron). */
    autoOpen: boolean("auto_open").notNull().default(false),
    /** Head tech and senior staff positions open before general staff. */
    preOpen: boolean("pre_open").notNull().default(false),
    /** Still in conversation with the client; excluded from overdue-quote nags. */
    isPlanning: boolean("is_planning").notNull().default(false),
    /** Client confirmed the quote via the brief link. */
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    /** Include in the daily staff digest. */
    notifyStaff: boolean("notify_staff").notNull().default(true),
    /** Emergency: bypass signup cooldowns. */
    isEmergency: boolean("is_emergency").notNull().default(false),

    // Dates
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    /** Scheduled auto-open date (legacy dateO). */
    openOn: date("open_on"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    billedAt: timestamp("billed_at", { withTimezone: true }),
    billSentAt: timestamp("bill_sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    cancelReason: text("cancel_reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_status_date_idx").on(t.status, t.eventDate),
    index("events_organization_idx").on(t.organizationId),
    index("events_contact_email_idx").on(t.contactEmail),
    index("events_payroll_idx").on(t.payrollId),
  ],
);

/** A priced package attached to an event (legacy table: work). */
export const eventLineItems = pgTable(
  "event_line_items",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    packageId: integer("package_id").references(() => packages.id, {
      onDelete: "set null",
    }),
    /** Snapshot of the package name at the time it was added. */
    name: text("name").notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: numeric("quantity", { precision: 8, scale: 2 })
      .notNull()
      .default("1"),
    description: text("description").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("event_line_items_event_idx").on(t.eventId)],
);

/** Ad hoc quote lines that are not from the price list. */
export const customQuoteItems = pgTable(
  "custom_quote_items",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("custom_quote_items_event_idx").on(t.eventId)],
);

// ---------------------------------------------------------------------------
// Staffing and pay
// ---------------------------------------------------------------------------

export const payrolls = pgTable("payrolls", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  paidOutAt: date("paid_out_at"),
  totalIncome: numeric("total_income", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  totalPayout: numeric("total_payout", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  totalVutcShare: numeric("total_vutc_share", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  totalRentals: numeric("total_rentals", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

/** A staff member working an event in a role (legacy table: pay). */
export const eventAssignments = pgTable(
  "event_assignments",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    role: staffRoleEnum("role").notNull(),
    signedUpAt: timestamp("signed_up_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Added by event management rather than self signup; exempt from cooldowns. */
    addedByStaff: boolean("added_by_staff").notNull().default(false),
    /** Fraction of run time worked, 0..1 (timesheet). */
    runFraction: numeric("run_fraction", { precision: 4, scale: 2 })
      .notNull()
      .default("0"),
    /** Fraction of load in/out worked, 0..1 (timesheet). */
    loadFraction: numeric("load_fraction", { precision: 4, scale: 2 })
      .notNull()
      .default("0"),
    pay: numeric("pay", { precision: 10, scale: 2 }).notNull().default("0"),
    hasDeduction: boolean("has_deduction").notNull().default(false),
    notes: text("notes").notNull().default(""),
    payrollId: integer("payroll_id").references(() => payrolls.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    uniqueIndex("event_assignments_unique").on(t.eventId, t.userId, t.role),
    index("event_assignments_user_idx").on(t.userId),
    index("event_assignments_payroll_idx").on(t.payrollId),
  ],
);

// ---------------------------------------------------------------------------
// Public site content
// ---------------------------------------------------------------------------

/** Executive board listing shown on the About page. */
export const boardPositions = pgTable("board_positions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  /** "Contact them about" text. */
  contactAbout: text("contact_about").notNull().default(""),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  /** Shown when no user is linked (e.g. faculty advisor). */
  displayName: text("display_name"),
  displayEmail: text("display_email"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  audience: notificationAudienceEnum("audience").notNull().default("staff"),
  priority: integer("priority").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  includeInDigest: boolean("include_in_digest").notNull().default(true),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    detail: text("detail"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_log_created_idx").on(t.createdAt),
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(staffProfiles, {
    fields: [user.id],
    references: [staffProfiles.userId],
  }),
  roles: many(userRoles),
  assignments: many(eventAssignments),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  user: one(user, { fields: [staffProfiles.userId], references: [user.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, { fields: [userRoles.userId], references: [user.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  events: many(events),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  lineItems: many(eventLineItems),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  lineItems: many(eventLineItems),
  customQuoteItems: many(customQuoteItems),
  assignments: many(eventAssignments),
  payroll: one(payrolls, {
    fields: [events.payrollId],
    references: [payrolls.id],
  }),
}));

export const eventLineItemsRelations = relations(eventLineItems, ({ one }) => ({
  event: one(events, {
    fields: [eventLineItems.eventId],
    references: [events.id],
  }),
  package: one(packages, {
    fields: [eventLineItems.packageId],
    references: [packages.id],
  }),
}));

export const customQuoteItemsRelations = relations(
  customQuoteItems,
  ({ one }) => ({
    event: one(events, {
      fields: [customQuoteItems.eventId],
      references: [events.id],
    }),
  }),
);

export const eventAssignmentsRelations = relations(
  eventAssignments,
  ({ one }) => ({
    event: one(events, {
      fields: [eventAssignments.eventId],
      references: [events.id],
    }),
    user: one(user, {
      fields: [eventAssignments.userId],
      references: [user.id],
    }),
    payroll: one(payrolls, {
      fields: [eventAssignments.payrollId],
      references: [payrolls.id],
    }),
  }),
);

export const boardPositionsRelations = relations(boardPositions, ({ one }) => ({
  user: one(user, { fields: [boardPositions.userId], references: [user.id] }),
}));

export const payrollsRelations = relations(payrolls, ({ many }) => ({
  events: many(events),
  assignments: many(eventAssignments),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type StaffRole = (typeof staffRoleEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type PackageCategory = (typeof packageCategoryEnum.enumValues)[number];
export type PayRouting = (typeof payRoutingEnum.enumValues)[number];

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type EventLineItem = typeof eventLineItems.$inferSelect;
export type EventAssignment = typeof eventAssignments.$inferSelect;
export type User = typeof user.$inferSelect;
