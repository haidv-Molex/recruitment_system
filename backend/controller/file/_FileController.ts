import express from "express";
import parseJobSheetController from "./parseJobSheetController";
import parseCandidateSheetController from "./parseCandidateSheetController";

const FileController = express.Router();

FileController.use("/parse-job-sheet", parseJobSheetController);
FileController.use("/parse-candidate-sheet", parseCandidateSheetController);

export default FileController;
