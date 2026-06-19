import express from "express";
import createNoteController from "./createNoteController";
import deleteNoteController from "./deleteNoteController";

const router = express.Router();

router.use("/", createNoteController);
router.use("/", deleteNoteController);

export default router;
