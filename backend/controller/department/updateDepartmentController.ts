import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Department from "@services/department/_Department";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateDepartmentController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã phòng ban phải là số",
    "number.integer": "Mã phòng ban phải là số nguyên",
    "number.positive": "Mã phòng ban phải là số dương",
    "any.required": "Mã phòng ban là bắt buộc"
  })
});

const bodySchema = Joi.object({
  department_code: Joi.string().max(255).optional().messages({
    "string.empty": "Mã phòng ban không được để trống",
    "string.max": "Mã phòng ban tối đa 255 ký tự"
  }),
  department_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên phòng ban không được để trống",
    "string.max": "Tên phòng ban tối đa 255 ký tự"
  }),
  department_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả phòng ban tối đa 255 ký tự"
  }),
  user_id: Joi.number().integer().optional().allow(null)
}).or("department_code", "department_name", "department_description", "user_id").messages({
  "object.missing": "Phải cung cấp ít nhất mã phòng ban, tên, mô tả hoặc người quản lý để cập nhật"
});

updateDepartmentController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Department.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin phòng ban thành công",
      data: result
    });
  }
);

export default updateDepartmentController;
