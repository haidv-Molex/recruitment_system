import express from "express";
import Joi from "joi";
import passport from "@middlewares/passport";
import joiValidate from "@middlewares/joiValidate";
import { sendOutlookEmail } from "@services/email/outlookEmailService";

const testEmailController = express.Router();

const testEmailSchema = Joi.object({
  to: Joi.string().email().optional(),
  subject: Joi.string().max(500).optional(),
  text: Joi.string().optional(),
  html: Joi.string().optional(),
});

testEmailController.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  joiValidate(testEmailSchema, "body"),
  async (req, res) => {
    const info = await sendOutlookEmail({
      to: req.body.to || process.env.TEST_EMAIL_TO,
      subject: req.body.subject || "Recruitment System Email Smoke Test",
      text: req.body.text || "Email smoke test from Recruitment System.",
      html: req.body.html,
    });

    res.status(200).json({
      result: true,
      message: "Email test sent successfully",
      data: { messageId: info.messageId },
    });
  }
);

export default testEmailController;
