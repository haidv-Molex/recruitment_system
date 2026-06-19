import express from "express";
import createAccessController from "./createAccessController";
import deleteAccessController from "./deleteAccessController";
import getAllAccessController from "./getAllAccessController";

const AccessController = express.Router();

AccessController.use("/", createAccessController);
AccessController.use("/search", getAllAccessController);
AccessController.use("/", deleteAccessController);

export default AccessController;
