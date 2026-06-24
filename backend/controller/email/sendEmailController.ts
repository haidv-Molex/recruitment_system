import express from "express";
import Joi from "joi";
import passport from "@middlewares/passport";
import joiValidate from "@middlewares/joiValidate";
import { AppError } from "@middlewares/AppError";
import { sendOutlookEmail } from "@services/email/outlookEmailService";
import { getOutlookCookieName, verifyOutlookSession } from "@services/email/outlookAccountService";
import { generateProtectedOfferLetterPdf } from "@services/email/offerLetterPdfService";

const sendEmailController = express.Router();

const sendEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().max(500).required(),
  html: Joi.string().allow("").optional(),
  text: Joi.string().allow("").optional(),
  offerLetterPdf: Joi.object({
    candidateName: Joi.string().trim().required(),
    position: Joi.string().trim().required(),
    startDate: Joi.string().trim().required(),
    templateId: Joi.string().trim().allow("").optional(),
    password: Joi.when("templateId", {
      is: "offer-letter-vietnam",
      then: Joi.string().trim().allow("").optional(),
      otherwise: Joi.string().trim().min(6).required(),
    }),
    offerDate: Joi.string().trim().allow("").optional(),
    dateOfBirth: Joi.when("templateId", {
      is: "offer-letter-vietnam",
      then: Joi.string().trim().required(),
      otherwise: Joi.string().trim().allow("").optional(),
    }),
    idNumber: Joi.string().trim().allow("").optional(),
    idIssueDate: Joi.string().trim().allow("").optional(),
    idIssuePlace: Joi.string().trim().allow("").optional(),
    address: Joi.string().trim().allow("").optional(),
    mobile: Joi.string().trim().allow("").optional(),
    email: Joi.string().trim().allow("").optional(),
    salutation: Joi.string().trim().allow("").optional(),
    department: Joi.string().trim().allow("").optional(),
    basicSalary: Joi.string().trim().allow("").optional(),
    basicSalaryText: Joi.string().trim().allow("").optional(),
    probationDays: Joi.string().trim().allow("").optional(),
  }).optional(),
}).or("html", "text");

function requireUserId(req: express.Request) {
  const userId = (req.user as any)?.user_id;
  if (!userId) {
    throw new AppError("Authenticated user is required", 401);
  }
  return Number(userId);
}

sendEmailController.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  joiValidate(sendEmailSchema, "body"),
  async (req, res) => {
    const session = verifyOutlookSession(req.cookies?.[getOutlookCookieName()], requireUserId(req));
    const attachments = [];

    if (req.body.offerLetterPdf) {
      const pdfBuffer = await generateProtectedOfferLetterPdf(req.body.offerLetterPdf);
      attachments.push({
        filename: `Offer Letter - ${req.body.offerLetterPdf.candidateName}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    const info = await sendOutlookEmail({
      to: req.body.to,
      subject: req.body.subject,
      html: req.body.html,
      text: req.body.text,
      from: session.outlook_email,
      attachments,
    });

    res.status(200).json({
      result: true,
      message: "Email sent successfully",
      data: { messageId: info.messageId },
    });
  }
);

export default sendEmailController;
