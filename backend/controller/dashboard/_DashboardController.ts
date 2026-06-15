import express from "express";
import hcRequestedByDepartmentController from "./hcRequestedByDepartmentController";
import hcByStatusAndExpectedOnboardMonthController from "./hcByStatusAndExpectedOnboardMonthController";

const DashboardController = express.Router();

DashboardController.use("/hc-by-department", hcRequestedByDepartmentController);
DashboardController.use("/hc-by-status-month", hcByStatusAndExpectedOnboardMonthController);

export default DashboardController;
