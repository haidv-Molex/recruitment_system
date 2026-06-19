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
  code: Joi.string().pattern(/^\d{6}$/).required(),
});

const requireUserId = (req: express.Request) => {
  const userId = (req.user as any)?.user_id;
  if (!userId) {
    throw new AppError("Please login first", 401);
  }
  return userId;
};

const outlookCookieOptions = (maxAge?: number): express.CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  ...(maxAge !== undefined ? { maxAge } : {}),
});

outlookAccountController.post(
  "/request-login",
  passport.authenticate("jwt", { session: false }),
  joiValidate(emailSchema, "body"),
  async (req, res) => {
    const data = await requestOutlookLogin(requireUserId(req), req.body.email);
    res.status(200).json({
      result: true,
      message: "Outlook login code sent successfully",
      data,
    });
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
      message: "Outlook login successful",
      data: { email: data.email },
    });
  }
);

outlookAccountController.get(
  "/session",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let session;
    try {
      session = verifyOutlookSession(req.cookies?.[getOutlookCookieName()], requireUserId(req));
    } catch {
      if (req.cookies?.[getOutlookCookieName()]) {
        res.clearCookie(getOutlookCookieName(), outlookCookieOptions());
      }
      return res.status(200).json({
        result: true,
        message: "No Outlook session found",
        data: null,
      });
    }

    res.status(200).json({
      result: true,
      message: "Outlook session fetched successfully",
      data: {
        email: session.outlook_email,
        expiresAt: session.exp ? new Date(session.exp * 1000).toISOString() : null,
      },
    });
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