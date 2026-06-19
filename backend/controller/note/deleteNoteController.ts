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
      await Note.delete(noteId, requestor.user_id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa ghi chú thành công"
    });
  }
);

export default deleteNoteController;
