import express from "express";
import Joi from "joi";
import passport from "@middlewares/passport";
import joiValidate from "@middlewares/joiValidate";
import { AppError } from "@middlewares/AppError";
import { sendOutlookEmail } from "@services/email/outlookEmailService";
import { getOutlookCookieName, verifyOutlookSession } from "@services/email/outlookAccountService";

const sendEmailController = express.Router();

const joiSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  text: Joi.string().allow("").optional(),
  html: Joi.string().allow("").required(),
});

const requireUserId = (req: express.Request) => {
  const userId = (req.user as any)?.user_id;
  if (!userId) {
    throw new AppError("Please login first", 401);
  }
  return userId;
};

sendEmailController.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  joiValidate(joiSchema, "body"),
  async (req, res) => {
    const session = verifyOutlookSession(req.cookies?.[getOutlookCookieName()], requireUserId(req));
    let info;
    try {
      info = await sendOutlookEmail({
        from: session.outlook_email,
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.text,
        html: req.body.html,
      });
    } catch (error: any) {
      const message = error?.response || error?.message || "Failed to send email";
      throw new AppError(`Email send failed: ${message}`, 502);
    }

    res.status(200).json({
      result: true,
      message: "Email sent successfully",
      data: {
        from: session.outlook_email,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      },
    });
  }
);

export default sendEmailController;