import { Resend } from "resend";
import { env } from "@/lib/env";

export type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
};

/**
 * Sends through Resend when RESEND_API_KEY is set, otherwise logs to the
 * console so development and tests never send real mail.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.info(
      `[email] to=${Array.isArray(message.to) ? message.to.join(",") : message.to} subject="${message.subject}"\n${message.text}`,
    );
    return;
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
    attachments: message.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
