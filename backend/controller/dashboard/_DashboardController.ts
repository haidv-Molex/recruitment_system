import express from "express";
import hcRequestedByDepartmentController from "./hcRequestedByDepartmentController";
import hcByStatusAndExpectedOnboardMonthController from "./hcByStatusAndExpectedOnboardMonthController";
import hcByRecruiterController from "./hcByRecruiterController";
import hcRequestedByHrbpController from "./hcRequestedByHrbpController";

const DashboardController = express.Router();

DashboardController.use("/hc-by-department", hcRequestedByDepartmentController);
DashboardController.use("/hc-by-status-month", hcByStatusAndExpectedOnboardMonthController);
DashboardController.use("/hc-by-recruiter", hcByRecruiterController);
DashboardController.use("/hc-by-hrbp", hcRequestedByHrbpController);

export default DashboardController;
