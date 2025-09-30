import { storage } from "./storage";
import { log } from "./vite";
import { sendEmail } from "./emailService";
import twilio from "twilio";

// Track if processor is already running to prevent multiple instances
let isProcessorRunning = false;
let processingIntervalId: NodeJS.Timeout | null = null;

// Initialize Twilio client for SMS
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
    console.error("[ReminderProcessor] Error initializing Twilio client:", error);
  }
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Helper function to send testimonial request
async function sendTestimonialRequest(client: any, project: any, channel: string = "email") {
  const testimonialUrl = `${process.env.REPL_URL || 'http://localhost:5000'}/submit/${project.id}?email=${encodeURIComponent(client.email)}`;
  
  console.log(`[ReminderProcessor] Sending ${channel} testimonial request to ${client.email} for project ${project.name}`);
  
  const variables = {
    clientName: client.name,
    projectName: project.name,
    testimonialUrl,
    companyName: client.company || project.name,
  };
  
  if (channel === "email") {
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
    
    console.log(`[ReminderProcessor] Email sent successfully to ${client.email}`);
  } else if (channel === "sms") {
    if (!twilioClient) {
      throw new Error("SMS functionality is not available - Twilio not properly configured");
    }
    
    if (!client.phone) {
      throw new Error("Client has no phone number for SMS");
    }
    
    const message = replaceTemplateVariables(
      `Hi {{clientName}}! Would you mind sharing a quick testimonial about your experience with {{companyName}}? It would mean a lot: {{testimonialUrl}}`,
      variables,
    );

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: client.phone,
    });
    
    console.log(`[ReminderProcessor] SMS sent successfully to ${client.phone}, SID: ${result.sid}`);
  }
  
  return { success: true, url: testimonialUrl };
}

// Helper function to schedule next recurring reminder (replicated from routes.ts)
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
    const sendTime = project.reminderSettings?.schedule?.[0]?.sendTime || "09:00";
    const [hours, minutes] = sendTime.split(':');
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
        recurringSequence: (metadata.recurringSequence || 0) + 1
      }
    });
    
    console.log(`[ReminderProcessor] Scheduled next recurring ${reminder.channel} reminder for client ${reminder.clientId} at ${nextScheduledAt}`);
  } catch (error) {
    console.error("[ReminderProcessor] Error scheduling next recurring reminder:", error);
  }
}

// Main function to process pending reminders
async function processPendingReminders() {
  if (isProcessorRunning) {
    console.log("[ReminderProcessor] Processing already in progress, skipping...");
    return;
  }

  isProcessorRunning = true;
  
  try {
    const now = new Date();
    console.log(`[ReminderProcessor] Checking for pending reminders at ${now.toISOString()}`);
    
    // Get all pending reminders across all projects
    const allPendingReminders = await storage.getAllPendingReminders();
    
    // Filter for reminders that are due
    const dueReminders = allPendingReminders.filter(reminder => 
      new Date(reminder.scheduledAt) <= now
    );
    
    if (dueReminders.length > 0) {
      console.log(`[ReminderProcessor] Found ${dueReminders.length} due reminders to process`);
    }
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const reminder of dueReminders) {
      try {
        // Get client information (already included in reminder.client)
        const client = reminder.client;
        if (!client) {
          console.error(`[ReminderProcessor] Client not found for reminder ${reminder.id}`);
          await storage.updateReminder(reminder.id, { 
            status: "failed",
            metadata: { 
              ...(reminder.metadata || {}), 
              error: "Client not found",
              processedAt: new Date().toISOString()
            }
          });
          errorCount++;
          continue;
        }

        // Check if client has opted out
        if (client.reminderOptOut) {
          console.log(`[ReminderProcessor] Client ${client.email} has opted out, canceling reminder ${reminder.id}`);
          await storage.updateReminder(reminder.id, { 
            status: "canceled",
            metadata: { 
              ...(reminder.metadata || {}), 
              cancelReason: "client_opted_out",
              processedAt: new Date().toISOString()
            }
          });
          continue;
        }
        
        // Get project information for this reminder
        const project = await storage.getProject(reminder.projectId);
        if (!project) {
          console.error(`[ReminderProcessor] Project not found for reminder ${reminder.id}`);
          await storage.updateReminder(reminder.id, { 
            status: "failed",
            metadata: { 
              ...(reminder.metadata || {}), 
              error: "Project not found",
              processedAt: new Date().toISOString()
            }
          });
          errorCount++;
          continue;
        }
        
        // Send the reminder
        console.log(`[ReminderProcessor] Processing reminder ${reminder.id} for ${client.email} via ${reminder.channel}`);
        
        if (reminder.channel === "email") {
          // Send email reminder
          try {
            await sendTestimonialRequest(client, project, "email");
            
            await storage.updateReminder(reminder.id, {
              status: "sent",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: { 
                ...(reminder.metadata || {}), 
                sentAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                automated: true
              }
            });
            
            console.log(`[ReminderProcessor] Email reminder sent successfully for ${client.email}`);
          } catch (emailError) {
            console.error(`[ReminderProcessor] Failed to send email to ${client.email}:`, emailError);
            
            await storage.updateReminder(reminder.id, {
              status: "failed",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: { 
                ...(reminder.metadata || {}), 
                failedAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                error: emailError instanceof Error ? emailError.message : "Unknown error",
                automated: true
              }
            });
            errorCount++;
            continue;
          }
        } else if (reminder.channel === "sms") {
          // Send SMS reminder
          try {
            await sendTestimonialRequest(client, project, "sms");
            
            await storage.updateReminder(reminder.id, {
              status: "sent",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: { 
                ...(reminder.metadata || {}), 
                sentAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                automated: true
              }
            });
            
            console.log(`[ReminderProcessor] SMS reminder sent successfully for ${client.phone}`);
          } catch (smsError) {
            console.error(`[ReminderProcessor] Failed to send SMS to ${client.phone}:`, smsError);
            
            await storage.updateReminder(reminder.id, {
              status: "failed",
              attemptNumber: (reminder.attemptNumber || 0) + 1,
              metadata: { 
                ...(reminder.metadata || {}), 
                failedAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                error: smsError instanceof Error ? smsError.message : "Unknown error",
                automated: true
              }
            });
            errorCount++;
            continue;
          }
        }
        
        // Schedule next recurring reminder if applicable
        await scheduleNextRecurringReminder(reminder, project);
        
        processedCount++;
        
      } catch (reminderError) {
        console.error(`[ReminderProcessor] Error processing reminder ${reminder.id}:`, reminderError);
        
        // Mark reminder as failed
        try {
          await storage.updateReminder(reminder.id, { 
            status: "failed",
            metadata: { 
              ...(reminder.metadata || {}), 
              error: reminderError instanceof Error ? reminderError.message : "Unknown error",
              processedAt: new Date().toISOString()
            }
          });
        } catch (updateError) {
          console.error(`[ReminderProcessor] Failed to update reminder status:`, updateError);
        }
        
        errorCount++;
      }
    }
    
    if (processedCount > 0 || errorCount > 0) {
      console.log(`[ReminderProcessor] Completed processing: ${processedCount} sent, ${errorCount} failed`);
    }
    
  } catch (error) {
    console.error("[ReminderProcessor] Error in reminder processing:", error);
  } finally {
    isProcessorRunning = false;
  }
}

// Function to start the reminder processor
export function startReminderProcessor() {
  if (processingIntervalId) {
    console.log("[ReminderProcessor] Processor already started");
    return;
  }
  
  console.log("[ReminderProcessor] Starting automated reminder processor (60-second intervals)");
  
  // Run immediately on startup
  processPendingReminders();
  
  // Then run every 60 seconds
  processingIntervalId = setInterval(processPendingReminders, 60 * 1000);
  
  // Handle graceful shutdown
  process.on('SIGTERM', stopReminderProcessor);
  process.on('SIGINT', stopReminderProcessor);
}

// Function to stop the reminder processor
export function stopReminderProcessor() {
  if (processingIntervalId) {
    console.log("[ReminderProcessor] Stopping automated reminder processor");
    clearInterval(processingIntervalId);
    processingIntervalId = null;
  }
}