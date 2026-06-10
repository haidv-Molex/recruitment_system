import express from "express";
import createCandidateController from "./createCandidateController";
import createCandidateWithAllController from "./createCandidateWithAllController";
import updateCandidateController from "./updateCandidateController";
import getCandidateByIdController from "./getCandidateByIdController";
import getAllCandidatesController from "./getAllCandidatesController";
import deleteCandidateController from "./deleteCandidateController";

const router = express.Router();

router.use("/", createCandidateController);
router.use("/extended", createCandidateWithAllController);
router.use("/", updateCandidateController);
router.use("/", getCandidateByIdController);
router.use("/search", getAllCandidatesController);
router.use("/", deleteCandidateController);

export default router;
