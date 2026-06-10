import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Company from "@services/company/_Company";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deleteCompanyController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã công ty phải là số",
    "number.integer": "Mã công ty phải là số nguyên",
    "number.positive": "Mã công ty phải là số dương",
    "any.required": "Mã công ty là bắt buộc"
  })
});

deleteCompanyController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      await Company.delete(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa công ty thành công"
    });
  }
);

export default deleteCompanyController;
