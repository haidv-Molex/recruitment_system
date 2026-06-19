import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";
import type { userOutputModel } from "@model/user/userModel";

const createNoteController = express.Router();

const bodySchema = Joi.object({
  text: Joi.string().required().messages({
    "any.required": "Nội dung ghi chú là bắt buộc",
    "string.empty": "Nội dung ghi chú không được để trống"
  }),
  candidate_id: Joi.number().integer().positive().optional().allow(null),
  job_id: Joi.number().integer().positive().optional().allow(null)
});

createNoteController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const requestor = req.user as userOutputModel;
    const userId = requestor.user_id;

    const result = await withTransaction(async (pool) => {
      return await Note.create({
        user_id: userId,
        text: req.body.text,
        candidate_id: req.body.candidate_id,
        job_id: req.body.job_id
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo ghi chú thành công",
      data: result
    });
  }
);

export default createNoteController;
