import express from "express";
import createPlatformController from "./createPlatformController";
import getAllPlatformsController from "./getAllPlatformsController";
import getPlatformByIdController from "./getPlatformByIdController";
import updatePlatformController from "./updatePlatformController";
import deletePlatformController from "./deletePlatformController";

const PlatformController = express.Router();

PlatformController.use("/", createPlatformController);
PlatformController.use("/search", getAllPlatformsController);
PlatformController.use("/", getPlatformByIdController);
PlatformController.use("/", updatePlatformController);
PlatformController.use("/", deletePlatformController);

export default PlatformController;
