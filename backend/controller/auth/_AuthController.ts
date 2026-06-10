import express from "express";
import loginController from "./loginController";

const AuthController = express.Router();

AuthController.use("/login", loginController);

export default AuthController;
