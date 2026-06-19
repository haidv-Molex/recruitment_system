import express from "express";
import testEmailController from "./testEmailController";
import outlookAccountController from "./outlookAccountController";
import sendEmailController from "./sendEmailController";
import emailTemplateController from "./emailTemplateController";

const EmailController = express.Router();

EmailController.use("/test", testEmailController);
EmailController.use("/outlook", outlookAccountController);
EmailController.use("/send", sendEmailController);
EmailController.use("/templates", emailTemplateController);

export default EmailController;