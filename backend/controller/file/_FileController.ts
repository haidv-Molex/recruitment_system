import express from "express";
import parseJobSheetController from "./parseJobSheetController";
import parseCandidateSheetController from "./parseCandidateSheetController";
import createValidationSheetController from "./createValidationSheetController";

const FileController = express.Router();

FileController.use("/parse-job-sheet", parseJobSheetController);
FileController.use("/parse-candidate-sheet", parseCandidateSheetController);
FileController.use("/validation-sheet", createValidationSheetController);

export default FileController;
