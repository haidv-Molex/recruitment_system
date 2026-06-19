import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createNoteController = express.Router();

const bodySchema = Joi.object({
  message: Joi.string().max(5000).required().messages({
    "any.required": "Nội dung note là bắt buộc",
    "string.empty": "Nội dung note không được để trống",
    "string.max": "Nội dung note không được vượt quá 5000 ký tự"
  }),
  candidate_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "Candidate ID phải là số nguyên",
    "number.integer": "Candidate ID phải là số nguyên",
    "number.positive": "Candidate ID phải là số dương"
  }),
  job_id: Joi.number().integer().positive().allow(null).optional().messages({
    "number.base": "Job ID phải là số nguyên",
    "number.integer": "Job ID phải là số nguyên",
    "number.positive": "Job ID phải là số dương"
  })
}).custom((value, helpers) => {
  if (value.candidate_id == null && value.job_id == null) {
    return helpers.error("object.missing");
  }
  return value;
}).messages({
  "object.missing": "Cần gắn note với ứng viên hoặc công việc"
});

createNoteController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Note.create({
        user_id: req.user!.user_id,
        message: req.body.message,
        candidate_id: req.body.candidate_id,
        job_id: req.body.job_id
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo note thành công",
      data: result
    });
  }
);

export default createNoteController;