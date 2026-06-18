import express from "express";
import testEmailController from "./testEmailController";

const EmailController = express.Router();

EmailController.use("/test", testEmailController);

export default EmailController;