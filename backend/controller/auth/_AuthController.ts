import express from "express";
import loginController from "./loginController";
import tokenController from "./tokenController";
import changePasswordController from "./changePasswordController";
import logoutController from "./logoutController";

const AuthController = express.Router();

AuthController.use("/login", loginController);
AuthController.use("/token", tokenController);
AuthController.use("/change-password", changePasswordController);
AuthController.use("/logout", logoutController);

export default AuthController;
