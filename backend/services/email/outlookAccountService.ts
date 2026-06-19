import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "@middlewares/AppError";
import { sendOutlookEmail } from "@services/email/outlookEmailService";
import jwtTimeToSeconds from "@utilities/jwtTimeToSeconds";

type PendingOutlookLogin = {
  userId: number;
  email: string;
  codeHash: string;
  expiresAt: number;
};

export type OutlookSessionPayload = {
  user_id: number;
  outlook_email: string;
  type: "outlook_session";
  exp?: number;
};

const pendingLogins = new Map<string, PendingOutlookLogin>();
const cookieName = "outlookSession";

const getSecret = () => {
  if (!process.env.SECRET_AUTH_TOKEN_KEY) {
    throw new AppError("Missing SECRET_AUTH_TOKEN_KEY", 500);
  }
  return process.env.SECRET_AUTH_TOKEN_KEY;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const validateCompanyEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const allowedDomains = (process.env.OUTLOOK_ALLOWED_DOMAINS || "molex.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  const domain = normalized.split("@")[1];
  if (!domain || !allowedDomains.includes(domain)) {
    throw new AppError("Only company Outlook email addresses are allowed", 400);
  }

  return normalized;
};

const hashCode = (code: string) => {
  return crypto
    .createHash("sha256")
    .update(`${code}:${getSecret()}`)
    .digest("hex");
};

const loginKey = (userId: number, email: string) => `${userId}:${email}`;

export async function requestOutlookLogin(userId: number, email: string) {
  const normalizedEmail = validateCompanyEmail(email);
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + Number(process.env.OUTLOOK_LOGIN_OTP_TTL_MS || 10 * 60 * 1000);

  pendingLogins.set(loginKey(userId, normalizedEmail), {
    userId,
    email: normalizedEmail,
    codeHash: hashCode(code),
    expiresAt,
  });

  await sendOutlookEmail({
    to: normalizedEmail,
    subject: "Recruitment System Outlook login code",
    text: `Your Recruitment System Outlook login code is ${code}. This code will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Outlook Login Verification</h2>
        <p>Your Recruitment System Outlook login code is:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  });

  return { email: normalizedEmail, expiresAt: new Date(expiresAt).toISOString() };
}

export async function verifyOutlookLogin(userId: number, email: string, code: string) {
  const normalizedEmail = validateCompanyEmail(email);
  const pending = pendingLogins.get(loginKey(userId, normalizedEmail));

  if (!pending || pending.expiresAt < Date.now()) {
    pendingLogins.delete(loginKey(userId, normalizedEmail));
    throw new AppError("Outlook login code is expired or invalid", 400);
  }

  if (pending.codeHash !== hashCode(code.trim())) {
    throw new AppError("Outlook login code is incorrect", 400);
  }

  pendingLogins.delete(loginKey(userId, normalizedEmail));

  const sessionExpires = (process.env.OUTLOOK_SESSION_EXPIRES || "8h") as SignOptions["expiresIn"];
  const maxAgeSeconds = await jwtTimeToSeconds(process.env.OUTLOOK_SESSION_EXPIRES || "8h");
  const payload: OutlookSessionPayload = {
    user_id: userId,
    outlook_email: normalizedEmail,
    type: "outlook_session",
  };
  const token = jwt.sign(payload, getSecret(), { expiresIn: sessionExpires });

  return { email: normalizedEmail, token, maxAgeSeconds };
}

export function verifyOutlookSession(token: string | undefined, userId: number): OutlookSessionPayload {
  if (!token) {
    throw new AppError("Please login with Outlook first", 401);
  }

  try {
    const payload = jwt.verify(token, getSecret()) as OutlookSessionPayload;
    if (payload.type !== "outlook_session" || payload.user_id !== userId) {
      throw new AppError("Invalid Outlook session", 401);
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Outlook session is expired or invalid", 401);
  }
}

export function getOutlookCookieName() {
  return cookieName;
}