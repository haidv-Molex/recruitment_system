import express from "express";
import createHRController from "./createHRController";
import changePasswordController from "./changePasswordController";
import updateProfileController from "./updateProfileController";
import getUserController from "./getUserController";
import createUserController from "./createUserController";
import updateUserController from "./updateUserController";

const UserController = express.Router();

UserController.use("/hr", createHRController);
UserController.use("/change-password", changePasswordController);
UserController.use("/profile", updateProfileController);
UserController.use("/profile/:user_id", getUserController);
UserController.use("/", createUserController);
UserController.use("/", updateUserController);

export default UserController;
