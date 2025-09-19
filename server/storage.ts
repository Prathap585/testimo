import {
  users,
  projects,
  clients,
  testimonials,
  contactSubmissions,
  usageMetrics,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Client,
  type InsertClient,
  type Testimonial,
  type InsertTestimonial,
  type ContactSubmission,
  type InsertContactSubmission,
  type UsageMetrics,
  type SubscriptionPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getClientsByProjectId(projectId: string): Promise<Client[]>;
  getAllClientsByUserId(userId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Testimonial operations
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getTestimonialsByProjectId(projectId: string): Promise<Testimonial[]>;
  getAllTestimonialsByUserId(userId: string): Promise<Testimonial[]>;
  getTestimonial(id: string): Promise<Testimonial | undefined>;
  updateTestimonial(id: string, updates: Partial<InsertTestimonial>): Promise<Testimonial>;
  deleteTestimonial(id: string): Promise<void>;
  getPublishedTestimonials(): Promise<Partial<Testimonial>[]>;
  getPublishedTestimonialsByProjectId(projectId: string): Promise<Partial<Testimonial>[]>;
  
  // Contact form operations
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  markContactSubmissionAsRead(id: string): Promise<void>;
  
  // Subscription operations
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: {
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: string;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  }): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getUserUsage(userId: string): Promise<UsageMetrics | undefined>;
  updateUserUsage(userId: string, usage: { projectsCount?: number; testimonialsCount?: number }): Promise<UsageMetrics>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Client operations
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async getClientsByProjectId(projectId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.projectId, projectId))
      .orderBy(desc(clients.createdAt));
  }

  async getAllClientsByUserId(userId: string): Promise<Client[]> {
    return await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        company: clients.company,
        projectId: clients.projectId,
        isContacted: clients.isContacted,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .innerJoin(projects, eq(clients.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Testimonial operations
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db.insert(testimonials).values(testimonial).returning();
    return newTestimonial;
  }

  async getTestimonialsByProjectId(projectId: string): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.projectId, projectId))
      .orderBy(desc(testimonials.createdAt));
  }

  async getAllTestimonialsByUserId(userId: string): Promise<Testimonial[]> {
    return await db
      .select({
        id: testimonials.id,
        projectId: testimonials.projectId,
        clientId: testimonials.clientId,
        clientName: testimonials.clientName,
        clientEmail: testimonials.clientEmail,
        clientTitle: testimonials.clientTitle,
        clientCompany: testimonials.clientCompany,
        content: testimonials.content,
        rating: testimonials.rating,
        isApproved: testimonials.isApproved,
        isPublished: testimonials.isPublished,
        videoUrl: testimonials.videoUrl,
        createdAt: testimonials.createdAt,
        updatedAt: testimonials.updatedAt,
      })
      .from(testimonials)
      .innerJoin(projects, eq(testimonials.projectId, projects.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(testimonials.createdAt));
  }

  async getTestimonial(id: string): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id));
    return testimonial;
  }

  async updateTestimonial(id: string, updates: Partial<InsertTestimonial>): Promise<Testimonial> {
    const [testimonial] = await db
      .update(testimonials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(testimonials.id, id))
      .returning();
    return testimonial;
  }

  async deleteTestimonial(id: string): Promise<void> {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }

  async getPublishedTestimonials(): Promise<Partial<Testimonial>[]> {
    return await db
      .select({
        id: testimonials.id,
        clientName: testimonials.clientName,
        clientTitle: testimonials.clientTitle,
        clientCompany: testimonials.clientCompany,
        content: testimonials.content,
        rating: testimonials.rating,
        videoUrl: testimonials.videoUrl,
        createdAt: testimonials.createdAt,
      })
      .from(testimonials)
      .where(and(eq(testimonials.isApproved, true), eq(testimonials.isPublished, true)))
      .orderBy(desc(testimonials.createdAt));
  }

  async getPublishedTestimonialsByProjectId(projectId: string): Promise<Partial<Testimonial>[]> {
    return await db
      .select({
        id: testimonials.id,
        clientName: testimonials.clientName,
        clientTitle: testimonials.clientTitle,
        clientCompany: testimonials.clientCompany,
        content: testimonials.content,
        rating: testimonials.rating,
        videoUrl: testimonials.videoUrl,
        createdAt: testimonials.createdAt,
      })
      .from(testimonials)
      .where(and(
        eq(testimonials.projectId, projectId),
        eq(testimonials.isApproved, true), 
        eq(testimonials.isPublished, true)
      ))
      .orderBy(desc(testimonials.createdAt));
  }

  async getPublishedTestimonialsByUserId(userId: string): Promise<(Partial<Testimonial> & { projectName: string; projectId: string })[]> {
    return await db
      .select({
        id: testimonials.id,
        clientName: testimonials.clientName,
        clientTitle: testimonials.clientTitle,
        clientCompany: testimonials.clientCompany,
        content: testimonials.content,
        rating: testimonials.rating,
        videoUrl: testimonials.videoUrl,
        createdAt: testimonials.createdAt,
        projectName: projects.name,
        projectId: projects.id,
      })
      .from(testimonials)
      .innerJoin(projects, eq(testimonials.projectId, projects.id))
      .where(and(
        eq(projects.userId, userId),
        eq(testimonials.isApproved, true), 
        eq(testimonials.isPublished, true)
      ))
      .orderBy(desc(testimonials.createdAt));
  }

  // Contact form operations
  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [newSubmission] = await db.insert(contactSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }

  async markContactSubmissionAsRead(id: string): Promise<void> {
    await db
      .update(contactSubmissions)
      .set({ isRead: true })
      .where(eq(contactSubmissions.id, id));
  }

  // Subscription operations
  async updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: string;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async getUserUsage(userId: string): Promise<UsageMetrics | undefined> {
    const [usage] = await db
      .select()
      .from(usageMetrics)
      .where(eq(usageMetrics.userId, userId));
    
    if (!usage) {
      // Create initial usage record
      const projectsCount = await db.select().from(projects).where(eq(projects.userId, userId));
      const testimonialsCount = await db.select().from(testimonials)
        .innerJoin(projects, eq(testimonials.projectId, projects.id))
        .where(eq(projects.userId, userId));
      
      return await this.updateUserUsage(userId, {
        projectsCount: projectsCount.length,
        testimonialsCount: testimonialsCount.length,
      });
    }
    
    return usage;
  }

  async updateUserUsage(userId: string, usage: { projectsCount?: number; testimonialsCount?: number }): Promise<UsageMetrics> {
    const [metrics] = await db
      .insert(usageMetrics)
      .values({
        userId,
        ...usage,
      })
      .onConflictDoUpdate({
        target: usageMetrics.userId,
        set: {
          ...usage,
          updatedAt: new Date(),
        },
      })
      .returning();
    return metrics;
  }
}

export const storage = new DatabaseStorage();
