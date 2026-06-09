import express from "express";
import createCompanyController from "./createCompanyController";
import getAllCompaniesController from "./getAllCompaniesController";
import getCompanyByIdController from "./getCompanyByIdController";
import updateCompanyController from "./updateCompanyController";
import deleteCompanyController from "./deleteCompanyController";

const CompanyController = express.Router();

CompanyController.use("/", createCompanyController);
CompanyController.use("/search", getAllCompaniesController);
CompanyController.use("/", getCompanyByIdController);
CompanyController.use("/", updateCompanyController);
CompanyController.use("/", deleteCompanyController);

export default CompanyController;
