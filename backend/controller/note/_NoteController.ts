import express from "express";
import createNoteController from "./createNoteController";
import deleteNoteController from "./deleteNoteController";
import updateNoteController from "./updateNoteController";

const router = express.Router();

router.use("/", createNoteController);
router.use("/", deleteNoteController);
router.use("/", updateNoteController);

export default router;

