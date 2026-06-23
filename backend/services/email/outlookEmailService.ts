import nodemailer from "nodemailer";
import { AppError } from "@middlewares/AppError";

export type SendOutlookEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
};

function getBooleanEnv(name: string, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

function getTransporter() {
  const host = process.env.OUTLOOK_SMTP_HOST;
  const port = Number(process.env.OUTLOOK_SMTP_PORT || 587);

  if (!host) {
    throw new AppError("OUTLOOK_SMTP_HOST is not configured", 500);
  }

  const authEnabled = getBooleanEnv("OUTLOOK_SMTP_AUTH_ENABLED", true);
  const ignoreTls = getBooleanEnv("OUTLOOK_SMTP_IGNORE_TLS", false);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    ignoreTLS: ignoreTls,
    tls: ignoreTls ? { rejectUnauthorized: false } : undefined,
    auth: authEnabled
      ? {
          user: process.env.OUTLOOK_SMTP_USER,
          pass: process.env.OUTLOOK_SMTP_PASSWORD,
        }
      : undefined,
  });
}

export async function sendOutlookEmail({ to, subject, html, text, from, attachments }: SendOutlookEmailInput) {
  if (!to || !subject || (!html && !text)) {
    throw new AppError("Email recipient, subject and content are required", 400);
  }

  const defaultFrom = process.env.OUTLOOK_SMTP_FROM || process.env.OUTLOOK_SMTP_USER;
  if (!from && !defaultFrom) {
    throw new AppError("OUTLOOK_SMTP_FROM or OUTLOOK_SMTP_USER is not configured", 500);
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: from || defaultFrom,
    to,
    subject,
    html,
    text,
    attachments,
  });
}
