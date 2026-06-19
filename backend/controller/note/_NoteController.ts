import express from "express";
import createNoteController from "@controller/note/createNoteController";
import getAllNotesController from "@controller/note/getAllNotesController";
import getNoteByIdController from "@controller/note/getNoteByIdController";
import updateNoteController from "@controller/note/updateNoteController";
import deleteNoteController from "@controller/note/deleteNoteController";

const NoteController = express.Router();

NoteController.use("/", createNoteController);
NoteController.use("/search", getAllNotesController);
NoteController.use("/", getNoteByIdController);
NoteController.use("/", updateNoteController);
NoteController.use("/", deleteNoteController);

export default NoteController;