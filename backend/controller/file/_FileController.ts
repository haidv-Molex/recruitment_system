import express from "express";
import parseJobSheetController from "./parseJobSheetController";
import parseCandidateSheetController from "./parseCandidateSheetController";
import createValidationSheetController from "./createValidationSheetController";
import createDatabaseSheetController from "./createDatabaseSheetController";
import createIDLTrackingSheetController from "./createIDLTrackingSheetController";
import createFullWorkbookController from "./createFullWorkbookController";
const FileController = express.Router();

FileController.use("/parse-job-sheet", parseJobSheetController);
FileController.use("/parse-candidate-sheet", parseCandidateSheetController);
FileController.use("/validation-sheet", createValidationSheetController);
FileController.use("/database-sheet", createDatabaseSheetController);
FileController.use("/idl-tracking-sheet", createIDLTrackingSheetController);
FileController.use("/full-workbook", createFullWorkbookController);
export default FileController;
