import express from "express";
import createCandidateDetailController from "./createCandidateDetailController";
import getAllCandidateDetailsController from "./getAllCandidateDetailsController";
import getCandidateDetailByIdController from "./getCandidateDetailByIdController";
import updateCandidateDetailController from "./updateCandidateDetailController";
import deleteCandidateDetailController from "./deleteCandidateDetailController";

const CandidateDetailController = express.Router();

CandidateDetailController.use("/", createCandidateDetailController);
CandidateDetailController.use("/search", getAllCandidateDetailsController);
CandidateDetailController.use("/", getCandidateDetailByIdController);
CandidateDetailController.use("/", updateCandidateDetailController);
CandidateDetailController.use("/", deleteCandidateDetailController);

export default CandidateDetailController;