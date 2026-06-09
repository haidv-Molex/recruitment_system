import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Company from "@services/company/_Company";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getCompanyByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công ty phải là số",
    "number.integer": "Mã công ty phải là số nguyên",
    "number.positive": "Mã công ty phải là số dương",
    "any.required": "Mã công ty là bắt buộc"
  })
});

getCompanyByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Company.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin công ty thành công",
      data: result
    });
  }
);

export default getCompanyByIdController;
