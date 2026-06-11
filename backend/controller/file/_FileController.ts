import express from "express";
import parseJobSheetController from "./parseJobSheetController";
import parseCandidateSheetController from "./parseCandidateSheetController";
import createValidationSheetController from "./createValidationSheetController";
import createDatabaseSheetController from "./createDatabaseSheetController";

const FileController = express.Router();

FileController.use("/parse-job-sheet", parseJobSheetController);
FileController.use("/parse-candidate-sheet", parseCandidateSheetController);
FileController.use("/validation-sheet", createValidationSheetController);
FileController.use("/database-sheet", createDatabaseSheetController);

export default FileController;
