import nodemailer from "nodemailer";

export type SendOutlookEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export async function sendOutlookEmail({ to, subject, html, text }: SendOutlookEmailInput) {
  const user = process.env.OUTLOOK_SMTP_USER || "thinh.vu@molex.com";
  const authEnabled = process.env.OUTLOOK_SMTP_AUTH_ENABLED !== "false";
  const pass = authEnabled ? requiredEnv("OUTLOOK_SMTP_PASSWORD") : undefined;
  const host = process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.OUTLOOK_SMTP_PORT || 587);
  const from = process.env.OUTLOOK_SMTP_FROM || user;
  const secure = process.env.OUTLOOK_SMTP_SECURE === "true" || port === 465;
  const ignoreTLS = process.env.OUTLOOK_SMTP_IGNORE_TLS === "true";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: authEnabled ? {
      user,
      pass,
    } : undefined,
    ignoreTLS,
    requireTLS: !ignoreTLS && port === 587,
    tls: {
      rejectUnauthorized: process.env.OUTLOOK_SMTP_ALLOW_INSECURE_TLS !== "true",
    },
  });

  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}