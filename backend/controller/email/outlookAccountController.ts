import express from "express";
import Joi from "joi";
import passport from "@middlewares/passport";
import joiValidate from "@middlewares/joiValidate";
import { AppError } from "@middlewares/AppError";
import {
  getOutlookCookieName,
  requestOutlookLogin,
  verifyOutlookLogin,
  verifyOutlookSession,
} from "@services/email/outlookAccountService";

const outlookAccountController = express.Router();

const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

function requireUserId(req: express.Request) {
  const userId = (req.user as any)?.user_id;
  if (!userId) {
    throw new AppError("Authenticated user is required", 401);
  }
  return Number(userId);
}

function outlookCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
    path: "/",
    maxAge,
  };
}

outlookAccountController.post(
  "/request-login",
  passport.authenticate("jwt", { session: false }),
  joiValidate(emailSchema, "body"),
  async (req, res) => {
    const data = await requestOutlookLogin(requireUserId(req), req.body.email);
    res.status(200).json({ result: true, message: "Verification code sent", data });
  }
);

outlookAccountController.post(
  "/verify-login",
  passport.authenticate("jwt", { session: false }),
  joiValidate(verifySchema, "body"),
  async (req, res) => {
    const data = await verifyOutlookLogin(requireUserId(req), req.body.email, req.body.code);
    res.cookie(getOutlookCookieName(), data.token, outlookCookieOptions(data.maxAgeSeconds * 1000));
    res.status(200).json({
      result: true,
      message: "Outlook login verified",
      data: { email: data.email, expiresAt: data.expiresAt },
    });
  }
);

outlookAccountController.get(
  "/session",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const session = verifyOutlookSession(req.cookies?.[getOutlookCookieName()], requireUserId(req));
      res.status(200).json({
        result: true,
        message: "Outlook session loaded",
        data: { email: session.outlook_email, expiresAt: null },
      });
    } catch {
      if (req.cookies?.[getOutlookCookieName()]) {
        res.clearCookie(getOutlookCookieName(), outlookCookieOptions());
      }
      res.status(200).json({ result: true, message: "No Outlook session", data: null });
    }
  }
);

outlookAccountController.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (_req, res) => {
    res.clearCookie(getOutlookCookieName(), outlookCookieOptions());
    res.status(200).json({ result: true, message: "Outlook session cleared" });
  }
);

export default outlookAccountController;
