import express from "express";
import createSegmentController from "./createSegmentController";
import getAllSegmentsController from "./getAllSegmentsController";
import getSegmentByIdController from "./getSegmentByIdController";
import updateSegmentController from "./updateSegmentController";
import deleteSegmentController from "./deleteSegmentController";

const SegmentController = express.Router();

SegmentController.use("/", createSegmentController);
SegmentController.use("/search", getAllSegmentsController);
SegmentController.use("/", getSegmentByIdController);
SegmentController.use("/", updateSegmentController);
SegmentController.use("/", deleteSegmentController);

export default SegmentController;
