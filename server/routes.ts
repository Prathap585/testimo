import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import {
  insertContactSubmissionSchema,
  subscriptionLimits,
  type SubscriptionPlan,
  csvClientImportSchema,
  insertClientSchema,
  brandingSettingsSchema,
  insertTestimonialSchema,
  insertReminderSchema,
} from "@shared/schema";
import { z } from "zod";
import twilio from "twilio";
import Stripe from "stripe";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { nanoid } from "nanoid";
import { createAuthRoutes } from "./auth";
import { authenticateJWT, type AuthenticatedRequest } from "./authMiddleware";
import { sendEmail } from "./emailService";

// Extend global type for temporary storage
declare global {
  var uploadTokens: Map<string, any> | undefined;
}

// Configure multer for CSV file uploads (store in memory for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(null, false); // Reject file gracefully
    }
  },
});

// Configure multer for logo uploads (use memory storage for secure validation)
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept safe image formats (no SVG to prevent XSS)
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/gif" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(null, false); // Reject file gracefully
    }
  },
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Twilio client only if credentials are valid
let twilioClient: any = null;
if (
  process.env.TWILIO_ACCOUNT_SID?.startsWith("AC") &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
  }
} else {
  console.log(
    "Twilio credentials not properly configured - SMS functionality disabled",
  );
}

// Template replacement helper
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => variables[key] || match,
  );
}

// Helper function to send testimonial request
async function sendTestimonialRequest(
  client: any,
  project: any,
  channel: string = "email",
) {
  const testimonialUrl = `${process.env.REPL_URL || "http://localhost:5000"}/submit/${project.id}?email=${encodeURIComponent(client.email)}`;

  console.log(
    `Sending ${channel} testimonial request to ${client.email} for project ${project.name}`,
  );

  if (channel === "email") {
    // Get email settings from project
    const emailSettings = (project.emailSettings as { fromName: string; subject: string; message: string }) || {
      fromName: project.name,
      subject: "Please share your testimonial for {{projectName}}",
      message: "Hi {{clientName}},\n\nI hope this message finds you well!\n\nI would greatly appreciate if you could take a few minutes to share your experience working with me on {{projectName}}. Your testimonial would mean a lot and help showcase the value of my work to future clients.\n\nYou can submit your testimonial using this link: {{testimonialUrl}}\n\nThank you so much for your time and support!\n\nBest regards"
    };

    const variables = {
      clientName: client.name,
      projectName: project.name,
      testimonialUrl,
      companyName: client.company || project.name,
    };

    // Replace template variables
    const subject = replaceTemplateVariables(emailSettings.subject, variables);
    const message = replaceTemplateVariables(emailSettings.message, variables);

    // Send email - this will throw on failure
    await sendEmail({
      to: client.email,
      from: "noreply@testimo.co",
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    });

    console.log(`Email sent successfully to ${client.email}`);
  } else if (channel === "sms") {
    // SMS not implemented yet, throw error
    throw new Error("SMS functionality not yet implemented");
  }

  return { success: true, url: testimonialUrl };
}

// Helper function to schedule automatic follow-up reminders
async function scheduleAutomaticReminders(client: any, project: any) {
  if (
    !project.reminderSettings?.enabled ||
    !project.reminderSettings?.schedule
  ) {
    return;
  }

  const schedule = project.reminderSettings.schedule;
  const now = new Date();

  // Schedule follow-up reminders based on project settings
  for (const rule of schedule) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + rule.offsetDays);

    // Set the specific time
    const [hours, minutes] = rule.sendTime.split(":");
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Only schedule if it's in the future
    if (scheduledAt > now) {
      try {
        await storage.createReminder({
          projectId: project.id,
          clientId: client.id,
          channel: project.reminderSettings.channels[0] || "email", // Use first available channel
          scheduledAt,
          status: "pending",
          attemptNumber: 0,
          metadata: {
            automatic: true,
            offsetDays: rule.offsetDays,
            recurring: rule.recurring || false,
            recurringInterval: rule.recurringInterval || null,
          },
        });

        console.log(
          `Scheduled automatic reminder for ${client.email} at ${scheduledAt}`,
        );
      } catch (error) {
        console.error("Error scheduling automatic reminder:", error);
      }
    }
  }
}

// Helper function to cancel pending reminders when testimonial is received
async function cancelPendingRemindersForClient(
  projectId: string,
  clientEmail: string,
) {
  try {
    // Find client by email in this project
    const clients = await storage.getClientsByProjectId(projectId);
    const client = clients.find((c) => c.email === clientEmail);

    if (!client) {
      console.log(
        `No client found with email ${clientEmail} in project ${projectId}`,
      );
      return;
    }

    // Get all pending reminders for this client
    const reminders = await storage.getRemindersByProjectId(projectId);
    const pendingReminders = reminders.filter(
      (r) => r.clientId === client.id && r.status === "pending",
    );

    // Cancel all pending reminders
    for (const reminder of pendingReminders) {
      await storage.updateReminder(reminder.id, {
        status: "canceled",
        metadata: {
          ...(reminder.metadata || {}),
          canceledAt: new Date().toISOString(),
          cancelReason: "testimonial_received",
        },
      });
      console.log(
        `Canceled pending reminder ${reminder.id} for ${clientEmail} - testimonial received`,
      );
    }

    if (pendingReminders.length > 0) {
      console.log(
        `Canceled ${pendingReminders.length} pending reminders for ${clientEmail}`,
      );
    }
  } catch (error) {
    console.error("Error canceling pending reminders:", error);
  }
}

// Helper function to schedule next recurring reminder
async function scheduleNextRecurringReminder(reminder: any, project: any) {
  const metadata = reminder.metadata || {};

  // Only schedule next reminder if this is marked as recurring
  if (!metadata.recurring || !metadata.recurringInterval) {
    return;
  }

  try {
    const now = new Date();
    const nextScheduledAt = new Date(now);

    // Calculate next reminder time based on interval
    switch (metadata.recurringInterval) {
      case "daily":
        nextScheduledAt.setDate(nextScheduledAt.getDate() + 1);
        break;
      case "alternate_days":
        nextScheduledAt.setDate(nextScheduledAt.getDate() + 2);
        break;
      case "weekly":
        nextScheduledAt.setDate(nextScheduledAt.getDate() + 7);
        break;
      default:
        // Default to 3 days if interval not recognized
        nextScheduledAt.setDate(nextScheduledAt.getDate() + 3);
    }

    // Set time based on project settings (default to 9 AM if not specified)
    const sendTime =
      project.reminderSettings?.schedule?.[0]?.sendTime || "09:00";
    const [hours, minutes] = sendTime.split(":");
    nextScheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Create the next reminder
    await storage.createReminder({
      projectId: reminder.projectId,
      clientId: reminder.clientId,
      channel: reminder.channel,
      scheduledAt: nextScheduledAt,
      status: "pending",
      attemptNumber: 0,
      metadata: {
        ...metadata,
        parentReminderId: reminder.id,
        recurringSequence: (metadata.recurringSequence || 0) + 1,
      },
    });

    console.log(
      `Scheduled next recurring ${reminder.channel} reminder for client ${reminder.clientId} at ${nextScheduledAt}`,
    );
  } catch (error) {
    console.error("Error scheduling next recurring reminder:", error);
  }
}

// SMS sending function
async function sendSMS(to: string, message: string): Promise<any> {
  if (!twilioClient) {
    throw new Error(
      "SMS functionality is not available - Twilio not properly configured",
    );
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  try {
    await fs.mkdir("uploads/logos", { recursive: true });
  } catch (error) {
    console.warn("Could not create uploads directory:", error);
  }

  // Static file serving for uploaded logos with security headers
  app.use("/uploads/logos", (req, res, next) => {
    // Security: prevent directory traversal and nested paths
    const p = req.path;
    if (p.includes("..") || p.slice(1).includes("/")) {
      return res.status(404).json({ message: "File not found" });
    }

    // Only serve image files with safe extensions
    const ext = path.extname(req.path).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      return res.status(404).json({ message: "File not found" });
    }

    next();
  });

  // Serve static files with security headers
  const express = await import("express");
  const staticServer = express.default.static("uploads/logos", {
    maxAge: "1d", // Cache for 1 day
    etag: true,
    setHeaders: (res) => {
      // Security headers for static files
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src 'self';",
      );
    },
  });

  app.use("/uploads/logos", staticServer);

  // JWT Authentication routes
  const authRoutes = createAuthRoutes(storage);
  app.post("/api/auth/signup", authRoutes.signup);
  app.post("/api/auth/login", authRoutes.login);

  // Auth routes
  app.get(
    "/api/auth/user",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Remove sensitive data before sending to frontend
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  // Contact form submission (public route)
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating contact submission:", error);
        res.status(500).json({ message: "Failed to submit contact form" });
      }
    }
  });

  // Public testimonials for wall display
  app.get("/api/testimonials/public", async (req, res) => {
    try {
      const testimonials = await storage.getPublishedTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching public testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Get published testimonials for a specific project (embeddable)
  app.get("/api/projects/:projectId/testimonials/embed", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { limit = "10", theme = "light", layout = "grid" } = req.query;

      console.log(
        `Embed API called for project ${projectId} with query params:`,
        { theme, layout, limit },
      );

      // Verify project exists and is active
      const project = await storage.getProject(projectId);
      if (!project || !project.isActive) {
        return res
          .status(404)
          .json({ message: "Project not found or inactive" });
      }

      const testimonials =
        await storage.getPublishedTestimonialsByProjectId(projectId);

      // Limit the number of testimonials
      const limitedTestimonials = testimonials.slice(
        0,
        parseInt(limit as string, 10),
      );

      const response = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
        testimonials: limitedTestimonials,
        settings: {
          theme: theme as string,
          layout: layout as string,
          limit: parseInt(limit as string, 10),
        },
      };

      console.log(`Embed API response settings:`, response.settings);
      res.json(response);
    } catch (error) {
      console.error("Error fetching embeddable testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Overall testimonial wall for user (all projects combined)
  app.get(
    "/api/testimonials/wall",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const { limit = "20", theme = "light", layout = "grid" } = req.query;

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const testimonials =
          await storage.getPublishedTestimonialsByUserId(userId);

        // Limit the number of testimonials
        const limitedTestimonials = testimonials.slice(
          0,
          parseInt(limit as string, 10),
        );

        const response = {
          user: {
            id: user.id,
            name:
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Your Business",
            email: user.email,
          },
          testimonials: limitedTestimonials,
          settings: {
            theme: theme as string,
            layout: layout as string,
            limit: parseInt(limit as string, 10),
          },
        };

        res.json(response);
      } catch (error) {
        console.error("Error fetching user testimonial wall:", error);
        res.status(500).json({ message: "Failed to fetch testimonials" });
      }
    },
  );

  // Public overall testimonial wall for sharing (embeddable)
  app.get("/api/testimonials/wall/:userId/embed", async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = "20", theme = "light", layout = "grid" } = req.query;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const testimonials =
        await storage.getPublishedTestimonialsByUserId(userId);

      // Limit the number of testimonials
      const limitedTestimonials = testimonials.slice(
        0,
        parseInt(limit as string, 10),
      );

      const response = {
        user: {
          id: user.id,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "Our Clients Say",
        },
        testimonials: limitedTestimonials,
        settings: {
          theme: theme as string,
          layout: layout as string,
          limit: parseInt(limit as string, 10),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching public user testimonial wall:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Protected routes - Projects
  app.get(
    "/api/projects",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const projects = await storage.getProjectsByUserId(userId);
        res.json(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ message: "Failed to fetch projects" });
      }
    },
  );

  app.post(
    "/api/projects",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;

        // Check usage limits
        const user = await storage.getUser(userId);
        const usage = await storage.getUserUsage(userId);
        const limits =
          subscriptionLimits[
            (user?.subscriptionPlan as SubscriptionPlan) || "free"
          ];

        if ((usage?.projectsCount || 0) >= limits.projects) {
          return res.status(403).json({
            message: "Project limit reached",
            limit: limits.projects,
            current: usage?.projectsCount || 0,
            upgradeRequired: true,
          });
        }

        const projectData = { ...req.body, userId };
        const project = await storage.createProject(projectData);

        // Update usage count
        await storage.updateUserUsage(userId, {
          projectsCount: (usage?.projectsCount || 0) + 1,
        });

        res.status(201).json(project);
      } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Failed to create project" });
      }
    },
  );

  app.get(
    "/api/projects/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        // Ensure user owns this project
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        res.json(project);
      } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Failed to fetch project" });
      }
    },
  );

  // Get public project info for testimonial submissions (no authentication required)
  app.get("/api/projects/:id/public", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Return only public information needed for testimonial submission
      const publicProject = {
        id: project.id,
        name: project.name,
        description: project.description,
      };

      res.json(publicProject);
    } catch (error) {
      console.error("Error fetching public project info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(
    "/api/projects/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        // Ensure user owns this project
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Whitelist allowed fields for security (branding/logo handled via dedicated endpoints)
        const { name, description, isActive, emailSettings, reminderSettings } =
          req.body;
        const allowedUpdates = {
          name,
          description,
          isActive,
          emailSettings,
          reminderSettings,
        };

        // Remove undefined fields
        Object.keys(allowedUpdates).forEach(
          (key) =>
            (allowedUpdates as any)[key] === undefined &&
            delete (allowedUpdates as any)[key],
        );

        const updatedProject = await storage.updateProject(
          req.params.id,
          allowedUpdates,
        );
        res.json(updatedProject);
      } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Failed to update project" });
      }
    },
  );

  // Update project email settings
  app.patch(
    "/api/projects/:id/email-settings",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        // Ensure user owns this project
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const { emailSettings } = req.body;
        const updatedProject = await storage.updateProject(req.params.id, {
          emailSettings,
        });
        res.json(updatedProject);
      } catch (error) {
        console.error("Error updating email settings:", error);
        res.status(500).json({ message: "Failed to update email settings" });
      }
    },
  );

  app.delete(
    "/api/projects/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const project = await storage.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        // Ensure user owns this project
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deleteProject(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Failed to delete project" });
      }
    },
  );

  // Project Branding endpoints
  app.post(
    "/api/projects/:projectId/logo",
    authenticateJWT,
    logoUpload.single("logo"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (!req.file) {
          return res
            .status(400)
            .json({
              message:
                "No logo file provided or invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
            });
        }

        // Validate file type using magic bytes (more secure than trusting headers)
        const fileType = await fileTypeFromBuffer(req.file.buffer);
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        const allowedExtensions = ["jpg", "png", "gif", "webp"];

        if (!fileType || !allowedTypes.includes(fileType.mime)) {
          return res.status(400).json({
            message: `Invalid file type. Detected: ${fileType?.mime || "unknown"}. Please upload a JPEG, PNG, GIF, or WebP image.`,
          });
        }

        // Use detected file type for safe extension, not originalname
        const safeExtension =
          allowedExtensions[allowedTypes.indexOf(fileType.mime)];
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const safeFilename = `logo-${uniqueSuffix}.${safeExtension}`;
        const safePath = path.join("uploads/logos", safeFilename);

        // Write file to safe location with safe name
        await fs.writeFile(safePath, req.file.buffer);

        // Generate the logo URL path
        const logoUrl = `/uploads/logos/${safeFilename}`;

        // Clean up old logo file if it exists
        const currentBranding = (project.brandingSettings as any) || {};
        if (
          currentBranding.logoUrl &&
          currentBranding.logoUrl.startsWith("/uploads/logos/")
        ) {
          const oldFilename = path.basename(currentBranding.logoUrl);
          const oldFilePath = path.join("uploads/logos", oldFilename);
          try {
            await fs.access(oldFilePath);
            await fs.unlink(oldFilePath);
          } catch (cleanupError) {
            console.warn("Failed to delete old logo file:", cleanupError);
            // Continue with upload even if cleanup fails
          }
        }

        // Update project branding settings with new logo URL
        const updatedBranding = {
          ...currentBranding,
          logoUrl,
        };

        const updatedProject = await storage.updateProject(
          req.params.projectId,
          {
            brandingSettings: updatedBranding,
          },
        );

        res.json({
          logoUrl,
          brandingSettings: updatedProject.brandingSettings,
          message: "Logo uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading logo:", error);
        res.status(500).json({ message: "Failed to upload logo" });
      }
    },
  );

  app.get(
    "/api/projects/:projectId/branding",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        res.json(project.brandingSettings || {});
      } catch (error) {
        console.error("Error fetching branding settings:", error);
        res.status(500).json({ message: "Failed to fetch branding settings" });
      }
    },
  );

  app.patch(
    "/api/projects/:projectId/branding",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Validate branding settings
        const validatedSettings = brandingSettingsSchema.parse(req.body);

        // Merge with existing branding settings (logoUrl is handled only via POST /logo endpoint)
        const currentBranding = project.brandingSettings || {};
        const updatedBranding = {
          ...currentBranding,
          ...validatedSettings,
        };

        const updatedProject = await storage.updateProject(
          req.params.projectId,
          {
            brandingSettings: updatedBranding,
          },
        );

        res.json(updatedProject.brandingSettings);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid branding settings",
            errors: error.errors,
          });
        }
        console.error("Error updating branding settings:", error);
        res.status(500).json({ message: "Failed to update branding settings" });
      }
    },
  );

  // Global routes for dashboard analytics
  app.get(
    "/api/clients",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const clients = await storage.getAllClientsByUserId(userId);
        res.json(clients);
      } catch (error) {
        console.error("Error fetching all clients:", error);
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    },
  );

  app.get(
    "/api/testimonials",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const testimonials = await storage.getAllTestimonialsByUserId(userId);
        res.json(testimonials);
      } catch (error) {
        console.error("Error fetching all testimonials:", error);
        res.status(500).json({ message: "Failed to fetch testimonials" });
      }
    },
  );

  // Protected routes - Clients
  app.get(
    "/api/projects/:projectId/clients",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const clients = await storage.getClientsByProjectId(
          req.params.projectId,
        );
        res.json(clients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    },
  );

  app.post(
    "/api/projects/:projectId/clients",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Check for duplicate email
        if (req.body.email) {
          const existingClient = await storage.getClientByProjectAndEmail(
            req.params.projectId,
            req.body.email,
          );
          if (existingClient) {
            return res.status(400).json({
              message: `A client with email ${req.body.email} already exists in this project.`,
            });
          }
        }

        const clientData = { ...req.body, projectId: req.params.projectId };
        const client = await storage.createClient(clientData);
        res.status(201).json(client);
      } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Failed to create client" });
      }
    },
  );

  app.patch(
    "/api/clients/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = await storage.getClient(req.params.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(client.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Check for duplicate email if email is being updated
        if (req.body.email && req.body.email !== client.email) {
          const existingClient = await storage.getClientByProjectAndEmail(
            client.projectId,
            req.body.email,
          );
          if (existingClient && existingClient.id !== client.id) {
            return res.status(400).json({
              message: `A client with email ${req.body.email} already exists in this project.`,
            });
          }
        }

        const previousWorkStatus = client.workStatus;
        const newWorkStatus = req.body.workStatus;

        const updatedClient = await storage.updateClient(
          req.params.id,
          req.body,
        );

        // If work status changed to "completed", automatically send testimonial request
        if (
          previousWorkStatus !== "completed" &&
          newWorkStatus === "completed"
        ) {
          try {
            // Send testimonial request immediately
            await sendTestimonialRequest(client, project, "email");

            // Schedule automatic follow-up reminders based on project settings
            if (
              project.reminderSettings &&
              (project.reminderSettings as any)?.enabled
            ) {
              await scheduleAutomaticReminders(client, project);
            }

            // Update client as contacted
            await storage.updateClient(req.params.id, {
              isContacted: true,
              lastContactedAt: new Date(),
            });
          } catch (error) {
            console.error(
              "Error sending automatic testimonial request:",
              error,
            );
            // Don't fail the status update if sending fails
          }
        }

        res.json(updatedClient);
      } catch (error) {
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Failed to update client" });
      }
    },
  );

  app.delete(
    "/api/clients/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = await storage.getClient(req.params.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(client.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deleteClient(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Failed to delete client" });
      }
    },
  );

  // Video Upload API endpoints
  app.post(
    "/api/video/upload-url",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { fileExtension, projectId } = req.body;

        if (!projectId) {
          return res.status(400).json({ message: "projectId is required" });
        }

        // Verify project ownership
        const project = await storage.getProject(projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Validate file extension
        const allowedExtensions = ["mp4", "webm", "mov", "avi"];
        const ext = fileExtension || "mp4";
        if (!allowedExtensions.includes(ext.toLowerCase())) {
          return res
            .status(400)
            .json({
              message: "Invalid file extension. Only video files are allowed.",
            });
        }

        const objectStorageService = new ObjectStorageService();
        const result = await objectStorageService.getVideoUploadURL(ext);

        // Create secure binding token for this upload
        const uploadToken = {
          objectPath: result.objectPath,
          userId: req.user!.userId,
          projectId: projectId,
          exp: Date.now() + 30 * 60 * 1000, // 30 minutes
        };

        // Store token temporarily (in production, use Redis or database)
        const tokenId = nanoid();
        global.uploadTokens = global.uploadTokens || new Map();
        global.uploadTokens.set(tokenId, uploadToken);

        res.json({
          ...result,
          uploadToken: tokenId,
        });
      } catch (error) {
        console.error("Error getting video upload URL:", error);
        res.status(500).json({ message: "Failed to get upload URL" });
      }
    },
  );

  app.post(
    "/api/testimonials/:id/video",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { objectPath, videoDuration, uploadToken } = req.body;

        if (!objectPath || !uploadToken) {
          return res
            .status(400)
            .json({ message: "objectPath and uploadToken are required" });
        }

        // Update testimonial with video information
        const testimonial = await storage.getTestimonial(req.params.id);
        if (!testimonial) {
          return res.status(404).json({ message: "Testimonial not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(testimonial.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Verify upload token and object path binding
        global.uploadTokens = global.uploadTokens || new Map();
        const tokenData = global.uploadTokens.get(uploadToken);

        if (!tokenData) {
          return res
            .status(400)
            .json({ message: "Invalid or expired upload token" });
        }

        if (tokenData.exp < Date.now()) {
          global.uploadTokens.delete(uploadToken);
          return res.status(400).json({ message: "Upload token expired" });
        }

        if (
          tokenData.objectPath !== objectPath ||
          tokenData.userId !== req.user!.userId ||
          tokenData.projectId !== testimonial.projectId
        ) {
          return res.status(403).json({ message: "Invalid token binding" });
        }

        // Clean up used token
        global.uploadTokens.delete(uploadToken);

        const updatedTestimonial = await storage.updateTestimonial(
          req.params.id,
          {
            type: "video",
            videoUrl: objectPath,
            videoStatus: "ready",
            videoDuration: videoDuration,
            videoProvider: "replit-storage",
            storageKey: objectPath,
          },
        );

        res.json(updatedTestimonial);
      } catch (error) {
        console.error("Error updating testimonial with video:", error);
        res.status(500).json({ message: "Failed to update testimonial" });
      }
    },
  );

  // PUBLIC Video Upload endpoints for testimonial submissions
  app.post("/api/video/upload-url/public", async (req, res) => {
    try {
      const { fileExtension, projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }

      // Verify project exists (no ownership check - public endpoint)
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Validate file extension
      const allowedExtensions = ["mp4", "webm", "mov", "avi"];
      const ext = fileExtension || "mp4";
      if (!allowedExtensions.includes(ext.toLowerCase())) {
        return res.status(400).json({
          message: "Invalid file extension. Only video files are allowed.",
        });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getVideoUploadURL(ext);

      // Create secure binding token for this upload (no userId - public)
      const uploadToken = {
        objectPath: result.objectPath,
        projectId: projectId,
        exp: Date.now() + 30 * 60 * 1000, // 30 minutes
      };

      // Store token temporarily
      const tokenId = nanoid();
      global.uploadTokens = global.uploadTokens || new Map();
      global.uploadTokens.set(tokenId, uploadToken);

      res.json({
        ...result,
        uploadToken: tokenId,
      });
    } catch (error) {
      console.error("Error getting public video upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.post("/api/testimonials/:id/video/public", async (req, res) => {
    try {
      const { objectPath, videoDuration, uploadToken } = req.body;

      if (!objectPath || !uploadToken) {
        return res.status(400).json({ 
          message: "objectPath and uploadToken are required" 
        });
      }

      // Get testimonial
      const testimonial = await storage.getTestimonial(req.params.id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }

      // Verify upload token and object path binding
      global.uploadTokens = global.uploadTokens || new Map();
      const tokenData = global.uploadTokens.get(uploadToken);

      if (!tokenData) {
        return res.status(400).json({ 
          message: "Invalid or expired upload token" 
        });
      }

      if (tokenData.exp < Date.now()) {
        global.uploadTokens.delete(uploadToken);
        return res.status(400).json({ message: "Upload token expired" });
      }

      if (
        tokenData.objectPath !== objectPath ||
        tokenData.projectId !== testimonial.projectId
      ) {
        return res.status(403).json({ message: "Invalid token binding" });
      }

      // Clean up used token
      global.uploadTokens.delete(uploadToken);

      const updatedTestimonial = await storage.updateTestimonial(
        req.params.id,
        {
          type: "video",
          videoUrl: objectPath,
          videoStatus: "ready",
          videoDuration: videoDuration,
          videoProvider: "replit-storage",
          storageKey: objectPath,
        },
      );

      res.json(updatedTestimonial);
    } catch (error) {
      console.error("Error updating testimonial with video (public):", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  // Video serving endpoint (PUBLIC - for video testimonials)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectPath = `/objects/${req.params.objectPath}`;
      console.log("Video request - objectPath:", objectPath);
      console.log("Video request - req.params.objectPath:", req.params.objectPath);

      // Security: Verify video belongs to a testimonial
      const testimonial = await db.query.testimonials.findFirst({
        where: (testimonials, { or, eq }) =>
          or(
            eq(testimonials.videoUrl, req.params.objectPath),
            eq(testimonials.storageKey, req.params.objectPath),
            eq(testimonials.videoUrl, objectPath),
            eq(testimonials.storageKey, objectPath),
          ),
      });

      console.log("Found testimonial:", testimonial ? { id: testimonial.id, videoUrl: testimonial.videoUrl, storageKey: testimonial.storageKey } : null);

      if (!testimonial) {
        console.log("No testimonial found for path:", objectPath);
        return res.status(404).json({ message: "Video not found" });
      }

      // Use the actual video URL from the testimonial
      const actualPath = testimonial.videoUrl || testimonial.storageKey || objectPath;
      console.log("Attempting to fetch from storage, path:", actualPath);

      const objectStorageService = new ObjectStorageService();
      const objectFile =
        await objectStorageService.getObjectEntityFile(actualPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving video:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.status(500).json({ message: "Failed to serve video" });
    }
  });

  // Reminder System API endpoints
  app.get(
    "/api/projects/:projectId/reminders",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const reminders = await storage.getRemindersByProjectId(
          req.params.projectId,
        );
        res.json(reminders);
      } catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ message: "Failed to fetch reminders" });
      }
    },
  );

  app.post(
    "/api/projects/:projectId/reminders",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Validate request body using Zod schema, with custom scheduledAt handling
        const validationSchema = z.object({
          clientId: z.string(),
          channel: z.enum(["email", "sms"]),
          scheduledAt: z
            .string()
            .or(z.date())
            .transform((val) => {
              return typeof val === "string" ? new Date(val) : val;
            }),
          templateKey: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        });

        console.log("Reminder request body:", req.body);
        const validationResult = validationSchema.safeParse(req.body);

        if (!validationResult.success) {
          console.log("Validation failed:", validationResult.error.errors);
          return res.status(400).json({
            message: "Invalid request data",
            errors: validationResult.error.errors,
          });
        }

        const { clientId, channel, scheduledAt, templateKey, metadata } =
          validationResult.data;

        // Validate client belongs to project
        const client = await storage.getClient(clientId);
        if (!client || client.projectId !== req.params.projectId) {
          return res
            .status(400)
            .json({ message: "Invalid client for this project" });
        }

        // Check if client has opted out of reminders
        if (client.reminderOptOut) {
          return res
            .status(400)
            .json({ message: "Client has opted out of reminders" });
        }

        const reminderData = {
          projectId: req.params.projectId,
          clientId,
          channel,
          scheduledAt, // Already converted to Date by the validation schema
          templateKey,
          status: "pending" as const,
          attemptNumber: 0,
          metadata: metadata || {},
        };

        const reminder = await storage.createReminder(reminderData);
        res.status(201).json(reminder);
      } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ message: "Failed to create reminder" });
      }
    },
  );

  app.post(
    "/api/reminders/:id/send",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reminder = await storage.getReminder(req.params.id);
        if (!reminder) {
          return res.status(404).json({ message: "Reminder not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(reminder.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Get client and project information for the reminder
        const client = await storage.getClient(reminder.clientId);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        // Generate testimonial submission URL with email for prepopulation
        const testimonialUrl = `${req.protocol}://${req.get("host")}/submit/${project.id}?email=${encodeURIComponent(client.email)}`;

        const variables = {
          clientName: client.name,
          projectName: project.name,
          testimonialUrl,
          companyName: client.company || project.name,
        };

        if (reminder.channel === "email") {
          try {
            // Get email settings from project
            const emailSettings = (project.emailSettings as { fromName: string; subject: string; message: string }) || {
              fromName: project.name,
              subject: "Please share your testimonial for {{projectName}}",
              message: "Hi {{clientName}},\n\nI hope this message finds you well!\n\nI would greatly appreciate if you could take a few minutes to share your experience working with me on {{projectName}}. Your testimonial would mean a lot and help showcase the value of my work to future clients.\n\nYou can submit your testimonial using this link: {{testimonialUrl}}\n\nThank you so much for your time and support!\n\nBest regards"
            };

            // Replace template variables
            const subject = replaceTemplateVariables(emailSettings.subject, variables);
            const message = replaceTemplateVariables(emailSettings.message, variables);

            // Send email
            await sendEmail({
              to: client.email,
              from: "noreply@testimo.co",
              subject: subject,
              text: message,
              html: message.replace(/\n/g, '<br>')
            });

            await storage.updateReminder(req.params.id, {
              status: "sent",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: { 
                sentAt: new Date().toISOString(), 
                variables,
                email: client.email,
                subject,
                message
              },
            });

            // Schedule next reminder if this is a recurring reminder
            await scheduleNextRecurringReminder(reminder, project);

            res.json({ message: "Email reminder sent successfully", variables });
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            await storage.updateReminder(req.params.id, {
              status: "failed",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: {
                failedAt: new Date().toISOString(),
                error: (emailError as Error).message,
              },
            });

            res.status(500).json({ message: "Failed to send email reminder" });
          }
        } else if (reminder.channel === "sms") {
          if (!client.phone) {
            return res
              .status(400)
              .json({ message: "Client has no phone number for SMS" });
          }

          try {
            const message = replaceTemplateVariables(
              `Hi {{clientName}}! Would you mind sharing a quick testimonial about your experience with {{companyName}}? It would mean a lot: {{testimonialUrl}}`,
              variables,
            );

            await sendSMS(client.phone, message);

            await storage.updateReminder(req.params.id, {
              status: "sent",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: {
                sentAt: new Date().toISOString(),
                phone: client.phone,
                message,
              },
            });

            // Schedule next reminder if this is a recurring reminder
            await scheduleNextRecurringReminder(reminder, project);

            res.json({ message: "SMS reminder sent successfully" });
          } catch (smsError) {
            console.error("SMS sending failed:", smsError);
            await storage.updateReminder(req.params.id, {
              status: "failed",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: {
                failedAt: new Date().toISOString(),
                error: (smsError as Error).message,
              },
            });

            res.status(500).json({ message: "Failed to send SMS reminder" });
          }
        } else {
          res.status(400).json({ message: "Unsupported reminder channel" });
        }
      } catch (error) {
        console.error("Error sending reminder:", error);
        res.status(500).json({ message: "Failed to send reminder" });
      }
    },
  );

  app.patch(
    "/api/reminders/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reminder = await storage.getReminder(req.params.id);
        if (!reminder) {
          return res.status(404).json({ message: "Reminder not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(reminder.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updatedReminder = await storage.updateReminder(
          req.params.id,
          req.body,
        );
        res.json(updatedReminder);
      } catch (error) {
        console.error("Error updating reminder:", error);
        res.status(500).json({ message: "Failed to update reminder" });
      }
    },
  );

  app.delete(
    "/api/reminders/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const reminder = await storage.getReminder(req.params.id);
        if (!reminder) {
          return res.status(404).json({ message: "Reminder not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(reminder.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deleteReminder(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting reminder:", error);
        res.status(500).json({ message: "Failed to delete reminder" });
      }
    },
  );

  // CSV Import endpoints
  app.get(
    "/api/projects/:projectId/clients/import/template",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Set headers for CSV download
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="clients_template.csv"',
        );

        // CSV template with headers
        const csvTemplate =
          'name,email,phone,company\n"John Doe","john@example.com","555-0123","Example Corp"\n"Jane Smith","jane@example.com","555-0124","Tech Solutions"';
        res.send(csvTemplate);
      } catch (error) {
        console.error("Error generating CSV template:", error);
        res.status(500).json({ message: "Failed to generate template" });
      }
    },
  );

  app.post(
    "/api/projects/:projectId/clients/import",
    authenticateJWT,
    upload.single("csvFile"),
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (!req.file) {
          return res
            .status(400)
            .json({
              message:
                "No CSV file provided or invalid file type. Please upload a CSV file.",
            });
        }

        // Parse CSV data
        const csvData = req.file.buffer.toString("utf-8");
        let records;

        try {
          records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
          });
        } catch (parseError) {
          return res.status(400).json({ message: "Invalid CSV format" });
        }

        const results = {
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [] as string[],
        };

        // Process each record
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          const rowNumber = i + 2; // +2 because of header row and 0-based index

          try {
            // Validate record using Zod schema
            const validatedData = csvClientImportSchema.parse(record);

            // Normalize email to lowercase for consistent deduplication
            const normalizedEmail = validatedData.email.toLowerCase().trim();

            // Add project ID
            const clientData = {
              ...validatedData,
              email: normalizedEmail,
              projectId: req.params.projectId,
            };

            // Check if client already exists (project_id + email unique constraint)
            const existingClient = await storage.getClientByProjectAndEmail(
              req.params.projectId,
              normalizedEmail,
            );

            if (existingClient) {
              // Update existing client
              await storage.updateClient(existingClient.id, {
                name: validatedData.name,
                phone: validatedData.phone,
                company: validatedData.company,
              });
              results.updated++;
            } else {
              // Create new client
              await storage.createClient(clientData);
              results.created++;
            }
          } catch (error) {
            console.error(`Error processing row ${rowNumber}:`, error);
            if (error instanceof z.ZodError) {
              const fieldErrors = error.errors
                .map((e) => `${e.path.join(".")}: ${e.message}`)
                .join(", ");
              results.errors.push(`Row ${rowNumber}: ${fieldErrors}`);
            } else {
              results.errors.push(
                `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
              );
            }
            results.skipped++;
          }
        }

        res.json(results);
      } catch (error) {
        console.error("Error importing CSV:", error);
        res.status(500).json({ message: "Failed to import CSV" });
      }
    },
  );

  // Protected routes - Testimonials
  app.get(
    "/api/projects/:projectId/testimonials",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Verify project ownership
        const project = await storage.getProject(req.params.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const testimonials = await storage.getTestimonialsByProjectId(
          req.params.projectId,
        );
        res.json(testimonials);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        res.status(500).json({ message: "Failed to fetch testimonials" });
      }
    },
  );

  app.post("/api/projects/:projectId/testimonials", async (req, res) => {
    try {
      // Public route - clients can submit testimonials
      const testimonialData = { ...req.body, projectId: req.params.projectId };
      const testimonial = await storage.createTestimonial(testimonialData);

      // Cancel any pending reminders for this client since testimonial was received
      await cancelPendingRemindersForClient(
        req.params.projectId,
        testimonialData.clientEmail,
      );

      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.patch(
    "/api/testimonials/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const testimonial = await storage.getTestimonial(req.params.id);
        if (!testimonial) {
          return res.status(404).json({ message: "Testimonial not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(testimonial.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const updatedTestimonial = await storage.updateTestimonial(
          req.params.id,
          req.body,
        );
        res.json(updatedTestimonial);
      } catch (error) {
        console.error("Error updating testimonial:", error);
        res.status(500).json({ message: "Failed to update testimonial" });
      }
    },
  );

  app.delete(
    "/api/testimonials/:id",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const testimonial = await storage.getTestimonial(req.params.id);
        if (!testimonial) {
          return res.status(404).json({ message: "Testimonial not found" });
        }

        // Verify project ownership
        const project = await storage.getProject(testimonial.projectId);
        if (!project || project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.deleteTestimonial(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting testimonial:", error);
        res.status(500).json({ message: "Failed to delete testimonial" });
      }
    },
  );

  // Get client data for testimonial form (public route for prepopulation)
  app.get("/api/projects/:projectId/client-by-email", async (req, res) => {
    try {
      const { projectId } = req.params;
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email parameter is required" });
      }

      // Get client by project and email
      const client = await storage.getClientByProjectAndEmail(projectId, email);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Return only safe client data (no sensitive info)
      res.json({
        name: client.name,
        email: client.email,
        company: client.company,
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
      res.status(500).json({ message: "Failed to fetch client data" });
    }
  });

  // Send testimonial request email
  app.post(
    "/api/clients/:id/send-testimonial-request",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = await storage.getClient(req.params.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        const project = await storage.getProject(client.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        // Verify project ownership
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Mark the client as contacted
        await storage.updateClient(client.id, { isContacted: true });

        // For now, simulate sending the email
        // TODO: Replace with actual email sending functionality
        console.log(
          `Simulated sending testimonial request email to ${client.email} for project ${project.name}`,
        );

        res.json({
          message: "Email testimonial request sent successfully",
          client: await storage.getClient(client.id),
        });
      } catch (error) {
        console.error("Error sending testimonial request:", error);
        res.status(500).json({ message: "Failed to send testimonial request" });
      }
    },
  );

  // Send testimonial request SMS
  app.post(
    "/api/clients/:id/send-sms-request",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const client = await storage.getClient(req.params.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }

        if (!client.phone) {
          return res
            .status(400)
            .json({ message: "Client does not have a phone number" });
        }

        const project = await storage.getProject(client.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        // Verify project ownership
        if (project.userId !== req.user!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Get SMS template from project settings
        const smsSettings = (project.smsSettings as { message: string }) || {
          message:
            "Hi {{clientName}}! Could you please share a testimonial for {{projectName}}? It would mean a lot to me. Submit here: {{testimonialUrl}}",
        };

        // Build testimonial URL with client email for prepopulation
        const testimonialUrl = `${req.protocol}://${req.get("host")}/submit/${project.id}?email=${encodeURIComponent(client.email)}`;

        // Replace template variables
        const message = replaceTemplateVariables(smsSettings.message, {
          clientName: client.name,
          projectName: project.name,
          testimonialUrl: testimonialUrl,
        });

        // Send SMS using Twilio
        await sendSMS(client.phone, message);

        // Mark the client as contacted
        await storage.updateClient(client.id, { isContacted: true });

        res.json({
          message: "SMS testimonial request sent successfully",
          client: await storage.getClient(client.id),
        });
      } catch (error: any) {
        console.error("Error sending SMS testimonial request:", error);

        // Return more specific error messages
        if (error.code === 21211) {
          res.status(400).json({ message: "Invalid phone number format" });
        } else if (error.code === 21408) {
          res
            .status(400)
            .json({ message: "Permission denied for phone number" });
        } else if (error.code === 21606) {
          res
            .status(400)
            .json({
              message:
                "Your Twilio phone number is not SMS-enabled. Please verify your Twilio phone number supports SMS messaging.",
            });
        } else {
          res
            .status(500)
            .json({ message: "Failed to send SMS testimonial request" });
        }
      }
    },
  );

  // Subscription management routes
  app.post(
    "/api/subscription/create-checkout",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const { plan } = req.body;

        if (!["pro", "agency"].includes(plan)) {
          return res.status(400).json({ message: "Invalid subscription plan" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Create or get Stripe customer
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email || "",
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          });
          stripeCustomerId = customer.id;
          await storage.updateUserStripeInfo(userId, { stripeCustomerId });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: plan === "pro" ? "Testimo Pro" : "Testimo Agency",
                  description:
                    plan === "pro"
                      ? "For growing businesses"
                      : "For agencies & teams",
                },
                unit_amount: plan === "pro" ? 1900 : 4900, // $19 or $49 in cents
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${req.headers.origin}/?subscription=success`,
          cancel_url: `${req.headers.origin}/pricing?canceled=true`,
          metadata: {
            userId,
            plan,
          },
          automatic_tax: {
            enabled: false,
          },
          customer_update: {
            address: "auto",
          },
        });

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ message: "Failed to create checkout session" });
      }
    },
  );

  app.post(
    "/api/subscription/cancel",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const user = await storage.getUser(userId);

        if (!user?.stripeSubscriptionId) {
          return res
            .status(400)
            .json({ message: "No active subscription found" });
        }

        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        res.json({
          message:
            "Subscription will be canceled at the end of the current period",
        });
      } catch (error: any) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ message: "Failed to cancel subscription" });
      }
    },
  );

  app.get(
    "/api/subscription/status",
    authenticateJWT,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user!.userId;
        const user = await storage.getUser(userId);
        const usage = await storage.getUserUsage(userId);

        const limits =
          subscriptionLimits[
            (user?.subscriptionPlan as SubscriptionPlan) || "free"
          ];

        res.json({
          plan: user?.subscriptionPlan || "free",
          status: user?.subscriptionStatus || "active",
          currentPeriodEnd: user?.currentPeriodEnd,
          usage: {
            projects: usage?.projectsCount || 0,
            testimonials: usage?.testimonialsCount || 0,
          },
          limits,
        });
      } catch (error: any) {
        console.error("Error fetching subscription status:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch subscription status" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
