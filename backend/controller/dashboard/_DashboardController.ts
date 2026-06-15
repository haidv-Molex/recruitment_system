import express from "express";
import hcRequestedByDepartmentController from "./hcRequestedByDepartmentController";
import hcByStatusAndExpectedOnboardMonthController from "./hcByStatusAndExpectedOnboardMonthController";
import hcByRecruiterController from "./hcByRecruiterController";
import hcRequestedByHrbpController from "./hcRequestedByHrbpController";
import hcRequestedByHiringManagerController from "./hcRequestedByHiringManagerController";
import hcRequestedByMonthController from "./hcRequestedByMonthController";
import jobHCTrackingController from "./jobHCTrackingController";

const DashboardController = express.Router();

DashboardController.use("/hc-by-department", hcRequestedByDepartmentController);
DashboardController.use("/hc-by-status-month", hcByStatusAndExpectedOnboardMonthController);
DashboardController.use("/hc-by-recruiter", hcByRecruiterController);
DashboardController.use("/hc-by-hrbp", hcRequestedByHrbpController);
DashboardController.use("/hc-by-hiring-manager", hcRequestedByHiringManagerController);
DashboardController.use("/hc-by-month", hcRequestedByMonthController);
DashboardController.use("/job-hc-tracking", jobHCTrackingController);

export default DashboardController;
