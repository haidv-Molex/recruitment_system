import express from "express";
import passport from "@middlewares/passport";
import { getEmailTemplates } from "@services/email/emailTemplateService";

const emailTemplateController = express.Router();

emailTemplateController.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (_req, res) => {
    const data = await getEmailTemplates();
    res.status(200).json({
      result: true,
      message: "Email templates fetched successfully",
      data,
    });
  }
);

export default emailTemplateController;