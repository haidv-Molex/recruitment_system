import express from "express";
import getAllAuditController from "./getAllAuditController";
import rollbackAuditController from "./rollbackAuditController";

const AuditController = express.Router();

AuditController.use("", getAllAuditController);
AuditController.use("/rollback", rollbackAuditController);

export default AuditController;
