import express from "express";
import createJobController from "./createJobController";
import getAllJobsController from "./getAllJobsController";
import getJobByIdController from "./getJobByIdController";
import updateJobController from "./updateJobController";
import deleteJobController from "./deleteJobController";
import parseSheetController from "./parseSheetController";

const JobController = express.Router();

JobController.use("/parse-sheet", parseSheetController);
JobController.use("/", createJobController);
JobController.use("/search", getAllJobsController);
JobController.use("/", getJobByIdController);
JobController.use("/", updateJobController);
JobController.use("/", deleteJobController);

export default JobController;
