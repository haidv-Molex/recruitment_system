import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Company from "@services/company/_Company";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const updateCompanyController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công ty phải là số",
    "number.integer": "Mã công ty phải là số nguyên",
    "number.positive": "Mã công ty phải là số dương",
    "any.required": "Mã công ty là bắt buộc"
  })
});

const bodySchema = Joi.object({
  company_name: Joi.string().max(255).optional().messages({
    "string.empty": "Tên công ty không được để trống",
    "string.max": "Tên công ty tối đa 255 ký tự"
  }),
  company_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả công ty tối đa 255 ký tự"
  })
}).or("company_name", "company_description").messages({
  "object.missing": "Phải cung cấp ít nhất tên công ty hoặc mô tả để cập nhật"
});

updateCompanyController.put("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Company.update(id, req.body, pool);
    });

    res.status(200).json({
      result: true,
      message: "Cập nhật thông tin công ty thành công",
      data: result
    });
  }
);

export default updateCompanyController;
