import express from "express";
import hcRequestedByDepartmentController from "./hcRequestedByDepartmentController";

const DashboardController = express.Router();

DashboardController.use("/hc-by-department", hcRequestedByDepartmentController);

export default DashboardController;
