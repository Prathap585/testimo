import { sql } from "drizzle-orm";
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription fields
  subscriptionPlan: varchar("subscription_plan").default("free"), // free, pro, agency
  subscriptionStatus: varchar("subscription_status").default("active"), // active, past_due, canceled
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table - each user can have multiple projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  emailSettings: jsonb("email_settings").default(sql`'{"fromName": "", "subject": "Please share your testimonial for {{projectName}}", "message": "Hi {{clientName}},\\n\\nI hope this message finds you well!\\n\\nI would greatly appreciate if you could take a few minutes to share your experience working with me on {{projectName}}. Your testimonial would mean a lot and help showcase the value of my work to future clients.\\n\\nYou can submit your testimonial using this link: {{testimonialUrl}}\\n\\nThank you so much for your time and support!\\n\\nBest regards"}'::jsonb`),
  smsSettings: jsonb("sms_settings").default(sql`'{"message": "Hi {{clientName}}! Could you please share a testimonial for {{projectName}}? It would mean a lot to me. Submit here: {{testimonialUrl}}"}'::jsonb`),
  // Branding settings for customization
  brandingSettings: jsonb("branding_settings").default(sql`'{"logoUrl": null, "primaryColor": "#3b82f6", "accentColor": "#1e40af", "fontFamily": "Inter", "cornerRadius": "0.5rem", "hidePlatformBranding": false}'::jsonb`),
  // Reminder settings for automated follow-ups
  reminderSettings: jsonb("reminder_settings").default(sql`'{"enabled": false, "channels": ["email"], "schedule": [{"offsetDays": 3, "sendTime": "09:00", "maxAttempts": 3, "cooldownDays": 7}], "quietHours": {"start": "22:00", "end": "08:00"}, "timezone": "UTC"}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table - people who can give testimonials
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  company: varchar("company"),
  isContacted: boolean("is_contacted").default(false),
  lastContactedAt: timestamp("last_contacted_at"),
  reminderOptOut: boolean("reminder_opt_out").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint on project_id + email for CSV import deduplication
  uniqueIndex("unique_project_client_email").on(table.projectId, table.email)
]);

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  clientId: varchar("client_id").references(() => clients.id), // Optional - for existing clients
  // Client information stored directly for public submissions
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email").notNull(),
  clientTitle: varchar("client_title"),
  clientCompany: varchar("client_company"),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  isApproved: boolean("is_approved").default(false),
  isPublished: boolean("is_published").default(false),
  // Video support fields
  type: varchar("type").default("text"), // 'text' or 'video'
  videoUrl: varchar("video_url"),
  videoStatus: varchar("video_status").default("pending"), // 'pending', 'processing', 'ready', 'failed'
  videoThumbnailUrl: varchar("video_thumbnail_url"),
  videoDuration: integer("video_duration"),
  videoProvider: varchar("video_provider"), // 'cloudflare', 'mux', 's3', etc.
  storageKey: varchar("storage_key"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminders table for automated follow-ups
export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  channel: varchar("channel").notNull(), // 'email' or 'sms'
  templateKey: varchar("template_key"), // for custom message templates
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'sent', 'failed', 'canceled'
  attemptNumber: integer("attempt_number").default(0),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for efficient reminder scheduling
  index("idx_reminders_scheduled_at").on(table.scheduledAt),
  index("idx_reminders_status_scheduled").on(table.status, table.scheduledAt),
  index("idx_reminders_project_status").on(table.projectId, table.status)
]);

// Usage tracking table
export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  projectsCount: integer("projects_count").default(0),
  testimonialsCount: integer("testimonials_count").default(0),
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  usageMetrics: many(usageMetrics),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  clients: many(clients),
  testimonials: many(testimonials),
  reminders: many(reminders),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  project: one(projects, {
    fields: [clients.projectId],
    references: [projects.id],
  }),
  testimonials: many(testimonials),
  reminders: many(reminders),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  project: one(projects, {
    fields: [testimonials.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [testimonials.clientId],
    references: [clients.id],
  }),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  user: one(users, {
    fields: [usageMetrics.userId],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  project: one(projects, {
    fields: [reminders.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [reminders.clientId],
    references: [clients.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CSV Import schema for bulk client creation
export const csvClientImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// Branding settings schema for project customization (PATCH operations only)
export const brandingSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
  fontFamily: z.enum(["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins"]).optional(),
  cornerRadius: z.string().regex(/^(\d+(\.\d+)?)(px|rem|em)$/, "Must be a valid CSS length").optional(),
  hidePlatformBranding: z.boolean().optional(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

export const insertUsageMetricsSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  updatedAt: true,
});
export type UsageMetrics = typeof usageMetrics.$inferSelect;
export type InsertUsageMetrics = z.infer<typeof insertUsageMetricsSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type CsvClientImport = z.infer<typeof csvClientImportSchema>;
export type BrandingSettings = z.infer<typeof brandingSettingsSchema>;

// Subscription plan limits
export const subscriptionLimits = {
  free: {
    projects: 1,
    testimonials: 3,
  },
  pro: {
    projects: 5,
    testimonials: Infinity,
  },
  agency: {
    projects: 20,
    testimonials: Infinity,
  },
} as const;

export type SubscriptionPlan = keyof typeof subscriptionLimits;
