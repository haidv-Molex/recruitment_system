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
  const pass = requiredEnv("OUTLOOK_SMTP_PASSWORD");
  const host = process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com";
  const port = Number(process.env.OUTLOOK_SMTP_PORT || 587);
  const from = process.env.OUTLOOK_SMTP_FROM || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    requireTLS: port === 587,
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