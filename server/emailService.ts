import { MailerSend, EmailParams as MailerSendEmailParams, Sender, Recipient } from 'mailersend';

console.log("🔧 Initializing MailerSend service...");

if (!process.env.MAILERSEND_API_KEY) {
  console.error("❌ MAILERSEND_API_KEY environment variable is not set");
  throw new Error("MAILERSEND_API_KEY environment variable must be set");
}

console.log("✅ MAILERSEND_API_KEY found, API key length:", process.env.MAILERSEND_API_KEY.length);

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

console.log("✅ MailerSend client initialized successfully");

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  console.log(`📧 Attempting to send email from ${params.from} to ${params.to} with subject: "${params.subject}"`);
  
  const sentFrom = new Sender(params.from, "Testimo");
  const recipients = [new Recipient(params.to)];

  const emailParams = new MailerSendEmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(params.subject);

  if (params.html) {
    emailParams.setHtml(params.html);
  }
  
  if (params.text) {
    emailParams.setText(params.text);
  }

  const response = await mailerSend.email.send(emailParams);
  console.log(`✅ Email sent successfully from ${params.from} to ${params.to}`, response);
}