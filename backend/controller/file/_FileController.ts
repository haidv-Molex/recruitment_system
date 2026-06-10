import express from "express";
import parseJobSheetController from "./parseJobSheetController";

const FileController = express.Router();

FileController.use("/parse-sheet", parseJobSheetController);

export default FileController;
