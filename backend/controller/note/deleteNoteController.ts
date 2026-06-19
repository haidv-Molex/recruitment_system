import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import { AppError } from "@middlewares/AppError";
import type { userOutputModel } from "@model/user/userModel";

const deleteNoteController = express.Router();

const querySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã ghi chú phải là số",
    "number.integer": "Mã ghi chú phải là số nguyên",
    "number.positive": "Mã ghi chú phải là số dương",
    "any.required": "Mã ghi chú là bắt buộc"
  })
});

deleteNoteController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;
    const noteId = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      // 1. Get note to verify ownership
      const note = await Note.getById(noteId, pool);

      // 2. Allow deletion if requestor is admin or is the creator of the note
      if (requestor.user_role !== "admin" && note.user.user_id !== requestor.user_id) {
        throw new AppError("Bạn không có quyền xóa ghi chú của người khác", 403);
      }

      await Note.delete(noteId, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa ghi chú thành công"
    });
  }
);

export default deleteNoteController;
