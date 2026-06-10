import express from "express";
import createDepartmentController from "./createDepartmentController";
import getAllDepartmentsController from "./getAllDepartmentsController";
import getDepartmentByIdController from "./getDepartmentByIdController";
import updateDepartmentController from "./updateDepartmentController";
import deleteDepartmentController from "./deleteDepartmentController";

const DepartmentController = express.Router();

DepartmentController.use("/", createDepartmentController);
DepartmentController.use("/search", getAllDepartmentsController);
DepartmentController.use("/", getDepartmentByIdController);
DepartmentController.use("/", updateDepartmentController);
DepartmentController.use("/", deleteDepartmentController);

export default DepartmentController;
