import express from "express";
import hcRequestedByDepartmentController from "./hcRequestedByDepartmentController";
import hcByStatusAndExpectedOnboardMonthController from "./hcByStatusAndExpectedOnboardMonthController";
import hcByRecruiterController from "./hcByRecruiterController";

const DashboardController = express.Router();

DashboardController.use("/hc-by-department", hcRequestedByDepartmentController);
DashboardController.use("/hc-by-status-month", hcByStatusAndExpectedOnboardMonthController);
DashboardController.use("/hc-by-recruiter", hcByRecruiterController);

export default DashboardController;
