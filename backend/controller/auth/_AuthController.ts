import express from "express";
import loginController from "./loginController";
import tokenController from "./tokenController";
import changePasswordController from "./changePasswordController";

const AuthController = express.Router();

AuthController.use("/login", loginController);
AuthController.use("/token", tokenController);
AuthController.use("/change-password", changePasswordController);

export default AuthController;
