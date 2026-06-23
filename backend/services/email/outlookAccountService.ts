import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "@middlewares/AppError";
import { sendOutlookEmail } from "@services/email/outlookEmailService";

export type OutlookSession = {
  user_id: number;
  outlook_email: string;
};

const otpStore = new Map<string, { codeHash: string; expiresAt: number }>();
const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = "outlookSession";

function getSecret() {
  const secret = process.env.OUTLOOK_SESSION_SECRET || process.env.SECRET_AUTH_TOKEN_KEY;
  if (!secret) {
    throw new AppError("Outlook session secret is not configured", 500);
  }
  return secret;
}

function getOtpKey(userId: number, email: string) {
  return `${userId}:${email.toLowerCase()}`;
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function getOutlookCookieName() {
  return COOKIE_NAME;
}

export async function requestOutlookLogin(userId: number, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError("Outlook email is required", 400);
  }

  const code = generateCode();
  otpStore.set(getOtpKey(userId, normalizedEmail), {
    codeHash: hashCode(code),
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  await sendOutlookEmail({
    to: normalizedEmail,
    subject: "Recruitment System Outlook Verification Code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });

  return {
    email: normalizedEmail,
    expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  };
}

export async function verifyOutlookLogin(userId: number, email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const key = getOtpKey(userId, normalizedEmail);
  const stored = otpStore.get(key);

  if (!stored || stored.expiresAt < Date.now()) {
    otpStore.delete(key);
    throw new AppError("Verification code is expired or invalid", 400);
  }

  if (stored.codeHash !== hashCode(code.trim())) {
    throw new AppError("Verification code is invalid", 400);
  }

  otpStore.delete(key);

  const payload: OutlookSession = {
    user_id: userId,
    outlook_email: normalizedEmail,
  };
  const token = jwt.sign(payload, getSecret(), { expiresIn: SESSION_TTL_SECONDS });

  return {
    email: normalizedEmail,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString(),
    token,
    maxAgeSeconds: SESSION_TTL_SECONDS,
  };
}

export function verifyOutlookSession(token: string | undefined, userId: number): OutlookSession {
  if (!token) {
    throw new AppError("Outlook session is required", 401);
  }

  const decoded = jwt.verify(token, getSecret()) as OutlookSession;
  if (decoded.user_id !== userId) {
    throw new AppError("Outlook session does not belong to current user", 401);
  }

  return decoded;
}
