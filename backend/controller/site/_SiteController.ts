import express from "express";
import createSiteController from "./createSiteController";
import getAllSitesController from "./getAllSitesController";
import getSiteByIdController from "./getSiteByIdController";
import updateSiteController from "./updateSiteController";
import deleteSiteController from "./deleteSiteController";

const SiteController = express.Router();

SiteController.use("/", createSiteController);
SiteController.use("/search", getAllSitesController);
SiteController.use("/", getSiteByIdController);
SiteController.use("/", updateSiteController);
SiteController.use("/", deleteSiteController);

export default SiteController;
