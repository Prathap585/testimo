import { MailerSend, EmailParams as MailerSendEmailParams, Sender, Recipient } from 'mailersend';

if (!process.env.MAILERSEND_API_KEY) {
  throw new Error("MAILERSEND_API_KEY environment variable must be set");
}

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
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
    return true;
  } catch (error) {
    console.error(`❌ MailerSend email error for ${params.to}:`, error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
    }
    return false;
  }
}