import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Department from "@services/department/_Department";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createDepartmentController = express.Router();

const bodySchema = Joi.object({
  department_code: Joi.string().max(255).required().messages({
    "any.required": "Mã phòng ban là bắt buộc",
    "string.empty": "Mã phòng ban không được để trống",
    "string.max": "Mã phòng ban tối đa 255 ký tự"
  }),
  department_name: Joi.string().max(255).required().messages({
    "any.required": "Tên phòng ban là bắt buộc",
    "string.empty": "Tên phòng ban không được để trống",
    "string.max": "Tên phòng ban tối đa 255 ký tự"
  }),
  department_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả phòng ban tối đa 255 ký tự"
  })
});

createDepartmentController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Department.create({
        department_code: req.body.department_code,
        department_name: req.body.department_name,
        department_description: req.body.department_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo phòng ban thành công",
      data: result
    });
  }
);

export default createDepartmentController;
