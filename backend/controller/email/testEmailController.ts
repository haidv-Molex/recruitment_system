import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import { AppError } from "@middlewares/AppError";
import { sendOutlookEmail } from "@services/email/outlookEmailService";

const testEmailController = express.Router();

const joiSchema = Joi.object({
  to: Joi.string().email().default(process.env.TEST_EMAIL_TO || "hai.do@molex.com"),
  subject: Joi.string().default("Recruitment System email test"),
  text: Joi.string().allow("").default("Hello, this email was sent from Postman through the backend."),
  html: Joi.string().allow("").optional(),
});

testEmailController.post("/", joiValidate(joiSchema, "body"), async (req, res) => {
  if (process.env.TEST_EMAIL_ENABLED !== "true") {
    throw new AppError("Test email endpoint is disabled", 403);
  }

  const { to, subject, text, html } = req.body;
  let info;
  try {
    info = await sendOutlookEmail({ to, subject, text, html });
  } catch (error: any) {
    const message = error?.response || error?.message || "Failed to send email";
    throw new AppError(`Email test failed: ${message}`, 502);
  }

  res.status(200).json({
    result: true,
    message: "Email sent successfully",
    data: {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    },
  });
});

export default testEmailController;