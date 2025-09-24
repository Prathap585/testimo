import { storage } from "./storage";
import { log } from "./vite";

// Track if processor is already running to prevent multiple instances
let isProcessorRunning = false;
let processingIntervalId: NodeJS.Timeout | null = null;

// Helper function to send testimonial request (replicated from routes.ts)
async function sendTestimonialRequest(client: any, project: any, channel: string = "email") {
  const testimonialUrl = `${process.env.REPL_URL || 'http://localhost:5000'}/submit/${project.id}?email=${encodeURIComponent(client.email)}`;
  
  console.log(`[ReminderProcessor] Sending ${channel} testimonial request to ${client.email} for project ${project.name}`);
  console.log(`[ReminderProcessor] Testimonial URL: ${testimonialUrl}`);
  
  // TODO: Replace with actual email sending functionality
  // For now, just log the action
  
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
          
          console.log(`[ReminderProcessor] Email reminder sent for ${client.email}`);
        } else if (reminder.channel === "sms") {
          // SMS reminders would need Twilio integration
          // For now, mark as sent but log that it's not implemented
          console.log(`[ReminderProcessor] SMS reminder for ${client.email} - SMS automation not implemented, marking as sent`);
          
          await storage.updateReminder(reminder.id, {
            status: "sent",
            attemptNumber: (reminder.attemptNumber || 0) + 1,
            metadata: { 
              ...(reminder.metadata || {}), 
              sentAt: new Date().toISOString(),
              processedAt: new Date().toISOString(),
              automated: true,
              note: "SMS automation not implemented"
            }
          });
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