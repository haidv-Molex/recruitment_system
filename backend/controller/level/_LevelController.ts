import express from "express";
import createLevelController from "./createLevelController";
import getAllLevelsController from "./getAllLevelsController";
import getLevelByIdController from "./getLevelByIdController";
import updateLevelController from "./updateLevelController";
import deleteLevelController from "./deleteLevelController";

const LevelController = express.Router();

LevelController.use("/", createLevelController);
LevelController.use("/search", getAllLevelsController);
LevelController.use("/", getLevelByIdController);
LevelController.use("/", updateLevelController);
LevelController.use("/", deleteLevelController);

export default LevelController;
