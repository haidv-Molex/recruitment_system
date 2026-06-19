import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import type { userOutputModel } from "@model/user/userModel";

const updateNoteController = express.Router();

const querySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã ghi chú phải là số",
    "number.integer": "Mã ghi chú phải là số nguyên",
    "number.positive": "Mã ghi chú phải là số dương",
    "any.required": "Mã ghi chú là bắt buộc"
  })
});

const bodySchema = Joi.object({
  text: Joi.string().required().messages({
    "any.required": "Nội dung ghi chú là bắt buộc",
    "string.empty": "Nội dung ghi chú không được để trống"
  })
});

updateNoteController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(querySchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;
    const noteId = parseInt(req.query.id as string, 10);
    const { text } = req.body;

    const result = await withTransaction(async (pool) => {
      return await Note.update({
        id: noteId,
        text,
        userId: requestor.user_id
      }, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật ghi chú thành công",
      data: result
    });
  }
);

export default updateNoteController;
