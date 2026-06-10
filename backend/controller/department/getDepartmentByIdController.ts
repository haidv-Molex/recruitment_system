import express from "express";
import Joi from "joi";
import joiValidate from "@middlewares/joiValidate";
import Department from "@services/department/_Department";
import { withTransaction } from "@middlewares/withTransaction";
import passport from "@middlewares/passport";

const getDepartmentByIdController = express.Router({ mergeParams: true });

const paramsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Mã phòng ban phải là số",
    "number.integer": "Mã phòng ban phải là số nguyên",
    "number.positive": "Mã phòng ban phải là số dương",
    "any.required": "Mã phòng ban là bắt buộc"
  })
});

getDepartmentByIdController.get("",
  passport.authenticate("jwt", { session: false }),
  joiValidate(paramsSchema, "query"),
  async (req, res) => {
    const id = parseInt(req.query.id as string, 10);

    const result = await withTransaction(async (pool) => {
      return await Department.getById(id, pool);
    });

    res.status(200).json({
      result: true,
      message: "Lấy thông tin phòng ban thành công",
      data: result
    });
  }
);

export default getDepartmentByIdController;
