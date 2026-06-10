import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Platform from "@services/platform/_Platform";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getPlatformByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã nền tảng phải là số",
    "number.integer": "Mã nền tảng phải là số nguyên",
    "number.positive": "Mã nền tảng phải là số dương",
    "any.required": "Mã nền tảng là bắt buộc"
  })
});

getPlatformByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Platform.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin nền tảng thành công",
      data: result
    });
  }
);

export default getPlatformByIdController;
