import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertContactSubmissionSchema, subscriptionLimits, type SubscriptionPlan } from "@shared/schema";
import { z } from "zod";
import twilio from "twilio";
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Twilio client only if credentials are valid
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_PHONE_NUMBER) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
  }
} else {
  console.log('Twilio credentials not properly configured - SMS functionality disabled');
}

// Template replacement helper
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
}

// SMS sending function
async function sendSMS(to: string, message: string): Promise<any> {
  if (!twilioClient) {
    throw new Error('SMS functionality is not available - Twilio not properly configured');
  }
  
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`Error sending SMS to ${to}:`, error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

      console.log(`Embed API called for project ${projectId} with query params:`, { theme, layout, limit });

      // Verify project exists and is active
      const project = await storage.getProject(projectId);
      if (!project || !project.isActive) {
        return res.status(404).json({ message: "Project not found or inactive" });
      }

      const testimonials = await storage.getPublishedTestimonialsByProjectId(projectId);
      
      // Limit the number of testimonials
      const limitedTestimonials = testimonials.slice(0, parseInt(limit as string, 10));

      const response = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description
        },
        testimonials: limitedTestimonials,
        settings: {
          theme: theme as string,
          layout: layout as string,
          limit: parseInt(limit as string, 10)
        }
      };

      console.log(`Embed API response settings:`, response.settings);
      res.json(response);
    } catch (error) {
      console.error("Error fetching embeddable testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Protected routes - Projects
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check usage limits
      const user = await storage.getUser(userId);
      const usage = await storage.getUserUsage(userId);
      const limits = subscriptionLimits[user?.subscriptionPlan as SubscriptionPlan || 'free'];
      
      if ((usage?.projectsCount || 0) >= limits.projects) {
        return res.status(403).json({ 
          message: "Project limit reached", 
          limit: limits.projects,
          current: usage?.projectsCount || 0,
          upgradeRequired: true
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
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns this project
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns this project
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedProject = await storage.updateProject(req.params.id, req.body);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Update project email settings
  app.patch("/api/projects/:id/email-settings", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns this project
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { emailSettings } = req.body;
      const updatedProject = await storage.updateProject(req.params.id, { emailSettings });
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      // Ensure user owns this project
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Global routes for dashboard analytics
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getAllClientsByUserId(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching all clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/testimonials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const testimonials = await storage.getAllTestimonialsByUserId(userId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching all testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Protected routes - Clients
  app.get("/api/projects/:projectId/clients", isAuthenticated, async (req: any, res) => {
    try {
      // Verify project ownership
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const clients = await storage.getClientsByProjectId(req.params.projectId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/projects/:projectId/clients", isAuthenticated, async (req: any, res) => {
    try {
      // Verify project ownership
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const clientData = { ...req.body, projectId: req.params.projectId };
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(client.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedClient = await storage.updateClient(req.params.id, req.body);
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(client.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Protected routes - Testimonials
  app.get("/api/projects/:projectId/testimonials", isAuthenticated, async (req: any, res) => {
    try {
      // Verify project ownership
      const project = await storage.getProject(req.params.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const testimonials = await storage.getTestimonialsByProjectId(req.params.projectId);
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/projects/:projectId/testimonials", async (req, res) => {
    try {
      // Public route - clients can submit testimonials
      const testimonialData = { ...req.body, projectId: req.params.projectId };
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.patch("/api/testimonials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const testimonial = await storage.getTestimonial(req.params.id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(testimonial.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTestimonial = await storage.updateTestimonial(req.params.id, req.body);
      res.json(updatedTestimonial);
    } catch (error) {
      console.error("Error updating testimonial:", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete("/api/testimonials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const testimonial = await storage.getTestimonial(req.params.id);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      // Verify project ownership
      const project = await storage.getProject(testimonial.projectId);
      if (!project || project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteTestimonial(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // Send testimonial request email
  app.post("/api/clients/:id/send-testimonial-request", isAuthenticated, async (req: any, res) => {
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
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Mark the client as contacted
      await storage.updateClient(client.id, { isContacted: true });

      // For now, simulate sending the email
      // TODO: Replace with actual email sending functionality
      console.log(`Simulated sending testimonial request email to ${client.email} for project ${project.name}`);

      res.json({ 
        message: "Email testimonial request sent successfully",
        client: await storage.getClient(client.id)
      });
    } catch (error) {
      console.error("Error sending testimonial request:", error);
      res.status(500).json({ message: "Failed to send testimonial request" });
    }
  });

  // Send testimonial request SMS
  app.post("/api/clients/:id/send-sms-request", isAuthenticated, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.phone) {
        return res.status(400).json({ message: "Client does not have a phone number" });
      }

      const project = await storage.getProject(client.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Verify project ownership
      if (project.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get SMS template from project settings
      const smsSettings = project.smsSettings as { message: string } || 
        { message: "Hi {{clientName}}! Could you please share a testimonial for {{projectName}}? It would mean a lot to me. Submit here: {{testimonialUrl}}" };

      // Build testimonial URL
      const testimonialUrl = `${req.protocol}://${req.get('host')}/submit/${project.id}`;

      // Replace template variables
      const message = replaceTemplateVariables(smsSettings.message, {
        clientName: client.name,
        projectName: project.name,
        testimonialUrl: testimonialUrl
      });

      // Send SMS using Twilio
      await sendSMS(client.phone, message);

      // Mark the client as contacted
      await storage.updateClient(client.id, { isContacted: true });

      res.json({ 
        message: "SMS testimonial request sent successfully",
        client: await storage.getClient(client.id)
      });
    } catch (error: any) {
      console.error("Error sending SMS testimonial request:", error);
      
      // Return more specific error messages
      if (error.code === 21211) {
        res.status(400).json({ message: "Invalid phone number format" });
      } else if (error.code === 21408) {
        res.status(400).json({ message: "Permission denied for phone number" });
      } else {
        res.status(500).json({ message: "Failed to send SMS testimonial request" });
      }
    }
  });

  // Subscription management routes
  app.post("/api/subscription/create-checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan } = req.body;
      
      if (!['pro', 'agency'].includes(plan)) {
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
          email: user.email || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan === 'pro' ? 'Testimo Pro' : 'Testimo Agency',
                description: plan === 'pro' ? 'For growing businesses' : 'For agencies & teams',
              },
              unit_amount: plan === 'pro' ? 1900 : 4900, // $19 or $49 in cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/?subscription=success`,
        cancel_url: `${req.headers.origin}/pricing?canceled=true`,
        metadata: {
          userId,
          plan,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/subscription/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ message: "Subscription will be canceled at the end of the current period" });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.get("/api/subscription/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const usage = await storage.getUserUsage(userId);
      
      const limits = subscriptionLimits[user?.subscriptionPlan as SubscriptionPlan || 'free'];
      
      res.json({
        plan: user?.subscriptionPlan || 'free',
        status: user?.subscriptionStatus || 'active',
        currentPeriodEnd: user?.currentPeriodEnd,
        usage: {
          projects: usage?.projectsCount || 0,
          testimonials: usage?.testimonialsCount || 0,
        },
        limits,
      });
    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
