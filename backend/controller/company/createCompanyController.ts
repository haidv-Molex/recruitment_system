import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Company from "@services/company/_Company";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const createCompanyController = express.Router();

const bodySchema = Joi.object({
  company_name: Joi.string().max(255).required().messages({
    "any.required": "Tên công ty là bắt buộc",
    "string.empty": "Tên công ty không được để trống",
    "string.max": "Tên công ty tối đa 255 ký tự"
  }),
  company_description: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Mô tả công ty tối đa 255 ký tự"
  })
});

createCompanyController.post("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(bodySchema, "body"),
  async (req, res) => {
    const result = await withTransaction(async (pool) => {
      return await Company.create({
        company_name: req.body.company_name,
        company_description: req.body.company_description
      }, pool);
    });

    res.status(201).json({
      result: true,
      message: "Tạo công ty thành công",
      data: result
    });
  }
);

export default createCompanyController;
