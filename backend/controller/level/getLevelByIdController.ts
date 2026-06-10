import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Level from "@services/level/_Level";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getLevelByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã cấp bậc phải là số",
    "number.integer": "Mã cấp bậc phải là số nguyên",
    "number.positive": "Mã cấp bậc phải là số dương",
    "any.required": "Mã cấp bậc là bắt buộc"
  })
});

getLevelByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Level.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin cấp bậc thành công",
      data: result
    });
  }
);

export default getLevelByIdController;
