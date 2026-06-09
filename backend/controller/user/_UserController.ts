import express from "express";
import createHRController from "./createHRController";
import changePasswordController from "./changePasswordController";
import updateProfileController from "./updateProfileController";
import getUserController from "./getUserController";

const UserController = express.Router();

UserController.use("/hr", createHRController);
UserController.use("/change-password", changePasswordController);
UserController.use("/profile", updateProfileController);
UserController.use("/profile/:user_id", getUserController);

export default UserController;
