import express from "express";
import createHRController from "./createHRController";
import updateProfileController from "./updateProfileController";
import getUserController from "./getUserController";
import getAllUsersController from "./getAllUsersController";
import createUserController from "./createUserController";
import updateUserController from "./updateUserController";
import deleteUserController from "./deleteUserController";
import changeAccountRoleController from "./changeAccountRoleController";

const UserController = express.Router();

UserController.use("/hr", createHRController);
UserController.use("/profile", updateProfileController);
UserController.use("/search", getAllUsersController);
UserController.use("/", getUserController);
UserController.use("/", createUserController);
UserController.use("/", updateUserController);
UserController.use("/", deleteUserController);
UserController.use("/", changeAccountRoleController);

export default UserController;
