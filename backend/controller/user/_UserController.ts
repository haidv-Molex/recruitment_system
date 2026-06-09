import express from "express";
import createHRController from "./createHRController";

const UserController = express.Router();

UserController.use("/hr", createHRController);

export default UserController;
