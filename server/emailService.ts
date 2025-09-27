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

    await mailerSend.email.send(emailParams);
    return true;
  } catch (error) {
    console.error('MailerSend email error:', error);
    return false;
  }
}