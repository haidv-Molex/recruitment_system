import express from "express";
import createJobController from "./createJobController";
import createJobWithAllController from "./createJobWithAllController";
import getAllJobsController from "./getAllJobsController";
import getJobByIdController from "./getJobByIdController";
import updateJobController from "./updateJobController";
import deleteJobController from "./deleteJobController";

const JobController = express.Router();

JobController.use("/extended", createJobWithAllController);
JobController.use("/", createJobController);
JobController.use("/search", getAllJobsController);
JobController.use("/", getJobByIdController);
JobController.use("/", updateJobController);
JobController.use("/", deleteJobController);

export default JobController;
