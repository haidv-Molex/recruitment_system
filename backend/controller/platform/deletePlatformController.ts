import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Platform from "@services/platform/_Platform";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const deletePlatformController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã nền tảng phải là số",
    "number.integer": "Mã nền tảng phải là số nguyên",
    "number.positive": "Mã nền tảng phải là số dương",
    "any.required": "Mã nền tảng là bắt buộc"
  })
});

deletePlatformController.delete("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    await withTransaction(async (pool) => {
      await Platform.delete(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Xóa nền tảng thành công"
    });
  }
);

export default deletePlatformController;
