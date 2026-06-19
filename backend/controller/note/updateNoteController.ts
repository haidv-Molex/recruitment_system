import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Note from "@services/note/_Note";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateNoteController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã note phải là số",
    "number.integer": "Mã note phải là số nguyên",
    "number.positive": "Mã note phải là số dương",
    "any.required": "Mã note là bắt buộc"
  })
});

const bodySchema = Joi.object({
  message: Joi.string().max(5000).optional().messages({
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
}).or("message", "candidate_id", "job_id").messages({
  "object.missing": "Phải cung cấp ít nhất một trường để cập nhật note"
});

updateNoteController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);
    const updateData: any = { user_id: req.user!.user_id };
    ["message", "candidate_id", "job_id"].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updateData[key] = req.body[key];
      }
    });

    const result = await withTransaction(async (pool) => {
      return await Note.update(id, updateData, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật note thành công",
      data: result
    });
  }
);

export default updateNoteController;