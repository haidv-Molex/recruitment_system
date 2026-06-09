import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Job from "@services/job/_Job";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateJobController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công việc phải là số",
    "number.integer": "Mã công việc phải là số nguyên",
    "number.positive": "Mã công việc phải là số dương",
    "any.required": "Mã công việc là bắt buộc"
  })
});

const bodySchema = Joi.object({
  job_code: Joi.string().max(255).optional().messages({
    "string.empty": "Mã công việc không được để trống",
    "string.max": "Mã công việc tối đa 255 ký tự"
  }),
  project: Joi.string().max(255).optional().messages({
    "string.empty": "Dự án không được để trống",
    "string.max": "Dự án tối đa 255 ký tự"
  }),
  candidate_required: Joi.number().integer().positive().optional().messages({
    "number.base": "Số lượng ứng viên yêu cầu phải là số",
    "number.integer": "Số lượng ứng viên yêu cầu phải là số nguyên",
    "number.positive": "Số lượng ứng viên yêu cầu phải là số dương"
  }),
  note: Joi.string().optional().allow("").messages({
    "string.base": "Ghi chú phải là chuỗi"
  }),
  file_id: Joi.number().integer().positive().optional().allow(null).messages({
    "number.base": "Mã file phải là số",
    "number.integer": "Mã file phải là số nguyên",
    "number.positive": "Mã file phải là số dương"
  })
}).or("job_code", "project", "candidate_required", "note", "file_id").messages({
  "object.missing": "Phải cung cấp ít nhất một trường thông tin để cập nhật"
});

updateJobController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Job.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin công việc thành công",
      data: result
    });
  }
);

export default updateJobController;
