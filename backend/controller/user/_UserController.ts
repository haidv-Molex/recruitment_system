import express from "express";
import createHRController from "./createHRController";
import updateProfileController from "./updateProfileController";
import getUserController from "./getUserController";
import createUserController from "./createUserController";
import updateUserController from "./updateUserController";
import deleteUserController from "./deleteUserController";
import changeAccountRoleController from "./changeAccountRoleController";

const UserController = express.Router();

UserController.use("/hr", createHRController);
UserController.use("/profile", updateProfileController);
UserController.use("/profile/:user_id", getUserController);
UserController.use("/", createUserController);
UserController.use("/:user_id", updateUserController);
UserController.use("/:user_id", deleteUserController);
UserController.use("/:user_id", changeAccountRoleController);

export default UserController;
